const failed_extensions = [];

document.querySelectorAll("img.doujin_image").forEach(el => {
    el.addEventListener("error", (event) => {
        handle_image_error(event)
    })
})

function handle_image_error (event) {
    const img_el            = event.target;
    const extensions        = ["jpg", "png", "jpeg", "gif"];

    const extension         = img_el.src.split(".").at(-1);
    const page              = img_el.src.split(".").at(-2).split("/").at(-1);
    const gallery_id        = img_el.src.split("/").at(-2);

    const fails             = [extension];
    const failed_ex         = failed_extensions.find(e => e.gid === gallery_id);

    if (failed_ex) {
        fails.push(...failed_ex.extensions);
    }

    const new_extension     = extensions.filter(e => !fails.includes(e))[0];

    if (!failed_ex) {
        failed_extensions.push({ gid: gallery_id, extensions: [extension] });
    } else {
        failed_ex.extensions.push(extension);
    }

    img_el.src = `./images/${gallery_id}/${page}.${new_extension}`;
}