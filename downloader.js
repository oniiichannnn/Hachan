async function Main () {
    const fs        = require("fs");
    const $         = require("node-superfetch");
    const readline  = require("readline");
    const cli = require("cli-color");

    const rl        = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

  
    let isfromhistory = false
    const Query = await (async () => {
        return new Promise(resolve => {
            const history = fs.readFileSync("./searchhistory.txt").toString();

            console.log(cli.blackBright("================== History =================="));
            console.log(history.split("\n").map((h, i) => {
                return `${i + 1} ${cli.yellow(h)}`
            }).join("\n"));
            console.log(cli.blackBright("Type a index to search a history"))


            rl.question(`Type query > `, (answer) => {
                rl.close();

                if (Number(answer) && history.split("\n")[Number(answer) - 1]) {
                    isfromhistory = true;
                    resolve(history.split("\n")[Number(answer) - 1])
                } else {
                    resolve(answer);
                }
            });
        })
    }) ();


    if (!isfromhistory) {
        fs.writeFileSync(
            "./searchhistory.txt"
            ,
    
                `${fs.readFileSync("./searchhistory.txt").toString()}\n`+
                `${Query}`
        )
    }

    console.log(`[🔍 Searching] ${Query}`);

    const __Search      = require("./Util/Search");
    const __GetDoujins  = require("./Util/GetDoujins");

    const HTMLContent   = await __Search(Query);
    const Results       = await __GetDoujins(
        HTMLContent
    );
    // const Results = require("./dumped.json");

    console.log("Completed Downloading all images")
}

Main().then();