const cp        = require("node:child_process")
const readline  = require("readline")
const cli       = require("cli-color")
const fs        = require("fs");

const oldFiles = require("./ImageData.json");


let WriteData = {};

// writing images data
for (const ImageDir of fs.readdirSync("./images")) {
    const NumberOfImages = fs.readdirSync(`./images/${ImageDir}`).length;

    WriteData[ImageDir] = NumberOfImages;
}


fs.writeFileSync("./ImageData.json", JSON.stringify(WriteData, null, 2));

const NewlyAddedImages = Object.keys(WriteData).filter(imagedir => imagedir in oldFiles === false);


const command = `tsc && git add . && git commit -m \"added [${NewlyAddedImages.length}] ${NewlyAddedImages.join(", ")}\" && git push -u origin main`;


command.split("&&").forEach(subcmd => {
    const Result = cp.execSync(subcmd);

    console.log(typeof Result === "string" ? Result : Result.toString());
});


console.log(cli.green("Pushed All Files."));