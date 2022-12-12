const fs = require("fs");

const files = fs.readdirSync("./images")

let data = {}

async function Main ()
{
    for (const file of files) {
        const id = `${Date.now()}-${Math.floor(Math.random() * 100000000000)}`;

        console.log(`"${file}"`)

        fs.renameSync
    }

    fs.writeFileSync("./names")
}

async function wait (ms) {
    return new Promise(res => {
        setTimeout(() => {res(true)}, ms)
    })
}