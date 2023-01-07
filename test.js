const fs = require("fs");

console.log(
    fs.readdirSync("./images")
    .filter(d => d.includes("-"))
    .map((data, i) => {
        const [a,b] = data.split("-");

        return `${i + 1}. https://e-hentai.org/g/${a}/${b}/`
    })
    .join("\n")
)