async function Main ()
{
    const $ = require("node-superfetch");
    const {parse}  = require("node-html-parser");
    const fs = require("fs");

    const request   = await $.get("https://fapello.com/pan-piano/");
    const body      = request.body.toString();
    const document  = parse(body);

    const latest_img    = document.querySelector("img.w-full.h-full.absolute.object-cover.inset-0").attributes.src;
    const max           = Number(latest_img.match(/_[0-9]+_/)[0].replace(/_/g, ""));
    // https://fapello.com/content/p/a/pan-piano/1000/pan-piano_0161_300px.jpg
    // https://fapello.com/content/p/a/pan-piano/1000/pan-piano_0161.jpg

    const format        = latest_img
        .slice("https://fapello.com/content/p/a/".length)
        .split("/")[1];
    
    const extension = latest_img.split("px")[1].slice(1);

    let startat = fs.readdirSync("./images/!PanPiano").length;

    for (let i = startat ; i < (max + 1) ; i++) {
        const url = `https://fapello.com/content/p/a/pan-piano/${format}/pan-piano_${gen_num(i)}.jpg`;

        console.log(`Downloaded ${i}/${max}`)
        fs.writeFileSync(`./images/!PanPiano/${i}.${extension}`, (await $.get(url)).body);
    }

    function gen_num (val) {
        if (typeof val !== "string") val = val.toString();


        let num = "";
        for (let i = 0 ; i < (format.length - val.length) ; i++) {
            num += "0"
        }

        num += val;

        return num;
    }
}

Main().then();