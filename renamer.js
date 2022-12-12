async function Main () {
    const fs        = require("fs");
    const cli = require("cli-color");
    const files = fs.readdirSync("./images").filter(f => !f.includes("--GAP--"));
    const $ = require("node-superfetch");
    const {parse} = require("node-html-parser")
    const clipboardy = require("node-clipboardy")

    const readline  = require("readline");
    const rl        = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });


    for (const file of files) {
        console.log(`[${files.indexOf(file) + 1}/${files.length}] ${file}`);

        const Query         = file.replace(/[^\w\s]/g, "");
        const Base_URL      = "https://e-hentai.org/?f_search=";

        const ParsedQuery   = encodeURIComponent(Query);

        const Response = await $.get(`${Base_URL}${ParsedQuery}`);

        const HTMLContent = Response.body.toString();

        let SearchResults;

        const ParsedHTMLContent = parse(HTMLContent);

        const Parents = ParsedHTMLContent.querySelectorAll(".gl3c.glname");

        SearchResults = Parents
            .map((Parent, i) => {
                const ChildElement  = Parent.childNodes[0];
                // const URL           = ChildElement.rawAttrs.match(/https:\/\/e-hentai\.org\/[a-zA-Z0-9 \W]+\/$/)[0];

                return {
                    link: ChildElement._rawAttrs.href,
                    title: ParsedHTMLContent.querySelectorAll(".glink")[i].text
                };
            });

        
        __Log(`🔍 Found ${SearchResults.length} results`);
        if (SearchResults.length === 0) {
            console.log("type the url manually", file);

            clipboardy.writeSync(file.replace(/[^\w\s]/g, ""));

            console.log("name copied to clipboard")
            
            const answer = await ask("type url > ");

            const GalleryID = answer.split("/")[4].replace("/", "");
            const GalleryToken = answer.split("/")[5].replace("/", "");
    
            fs.renameSync(
                `./images/${file}`,
    
    
                `./images/${GalleryID}&${GalleryToken}--GAP--${file}`
            )
    
            console.log("renamed")

            continue;
        }

        console.log(SearchResults
            .map((res, i) => {
                return (
                    `${i + 1}. ${cli.yellow(res.title)}\n`+
                    `     ${cli.blackBright(res.link)}\n`
                )
            })
            .join("\n")
        )

        const answer = SearchResults.length === 1 ? "1" : await ask("Which one? (type index)");

        if (SearchResults.length === 1) console.log("Only 1 index, auto using that")
        if (answer.length === 0 || !Number(answer)) continue;

        const GalleryID = SearchResults[Number(answer) - 1].link.split("/")[4].replace("/", "");
        const GalleryToken = SearchResults[Number(answer) - 1].link.split("/")[5].replace("/", "");

        console.log(`./images/${GalleryID}&${GalleryToken}--GAP--${file}`)
        fs.renameSync(
            `./images/${file}`,


            `./images/${GalleryID}&${GalleryToken}--GAP--${file}`
        )

        console.log("renamed")
    }

    async function ask (question) {
        return new Promise(res => {
            rl.question(question, answer => {
                rl.close();

                res(answer);
            });
        })
    }

    function __Log (data) {
        console.log(data);
    }
}

Main().then()