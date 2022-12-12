async function Main () {
    const fs        = require("fs");
    const $         = require("node-superfetch");
    const readline  = require("readline");
    const cli = require("cli-color");
    const __Search      = require("./Util/Search");
    const __GetDoujins  = require("./Util/GetDoujins");

    const rl        = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

  
    const Queue = fs.readFileSync("./queue.txt").toString().split("\n").filter(query => query.length > 1);

    if (Queue[0]) {
        console.log(`[⚙️] ${Queue.length} items in queue, downloading...`);

        for (const query of Queue) {
            console.log(`[⚙️] (${Queue.indexOf(query) + 1}/${Queue.length}) Downloading query "${query}"`);

            await Download(query, true);
            
            if (Queue.indexOf(query) + 1 !== Queue.length) {
                fs.writeFileSync("./queue.txt", Queue
                    .filter(
                        (q, i) => i > Queue.indexOf(query)
                    )
                    .join("\n")
                )
            }
        }

        fs.writeFileSync("./queue.txt", "")
    } else {
        let isfromhistory = false
        const Query = (await (async () => {
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
        }) ());

        await Download(Query, isfromhistory);
    }

    async function Download (Query, isfromhistory) {
        if (!isfromhistory) {
            fs.writeFileSync(
                "./searchhistory.txt"
                ,
        
                    `${fs.readFileSync("./searchhistory.txt").toString()}\n`+
                    `${Query}`
            )
        }
    
        console.log(`[🔍 Searching] ${Query}`);
    
        if (Query.startsWith("https://e-hentai.org/g/")) {
            const Links = Query.split(",");
    
            try {
                await __GetDoujins(
                    undefined, undefined, Links
                );    
            } catch (e) {
                console.log(e)
                throw new Error("⛔ Invalid gallery link")
            } 
        } else {
            const HTMLContent   = await __Search(Query);

            await __GetDoujins(HTMLContent);
        }
    
        console.log("Completed Downloading all images")
    }
}

Main().then();