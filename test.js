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

console.log(NewlyAddedImages)