const cp        = require("node:child_process")
const readline  = require("readline")
const cli       = require("cli-color")
const fs        = require("fs");
const $         = require("node-superfetch");

const oldFiles = require("./ImageData.json");
const { parse } = require("node-html-parser");


async function Main () 
{
    let WriteData = oldFiles;
    const ImageDatasRequiredToFetch = fs.readdirSync("./images").filter(gid => gid in WriteData === false);

    for (const GalleryId of ImageDatasRequiredToFetch) {
        console.log(`[${ImageDatasRequiredToFetch.indexOf(GalleryId) + 1}/${ImageDatasRequiredToFetch.length}] Fetching data for ${cli.yellowBright(GalleryId)}`);

        const request   = await $.get(`https://hentaiera.com/gallery/${GalleryId}/`);
        const body      = request.body.toString();
        const document  = parse(body);

        const title = document.querySelector("div.row.gallery_first h1").innerHTML;
        const pages = fs.readdirSync(`./images/${GalleryId}`).length;
        const tags  = document.querySelectorAll("a.tag")
            .map(el => {
                const url       = el.attributes.href;
                const category  = url.split("/")[1];
                const tag       = url.split("/")[2];

                return { category, tag };
            });
        const category = tags.find(t => t.category === "category").tag;

        WriteData[GalleryId] = { title, tags, pages, category };
    }


    fs.writeFileSync("./ImageData.json", JSON.stringify(WriteData, null, 2));

    const NewlyAddedImages = Object.keys(WriteData).filter(imagedir => imagedir in oldFiles === false);

    console.log("Newly Added", NewlyAddedImages);

    const command = `git add . && git commit -m \"added [${NewlyAddedImages.length}] ${NewlyAddedImages.join(", ")}\" && git push -u origin main`;


    command.split("&&").forEach(subcmd => {
        console.time(subcmd);
        
        cp.execSync(subcmd, {stdio: 'inherit'});
        
        console.timeEnd(subcmd);
    });


    console.log(cli.green("Pushed All Files."));
}


Main().then();