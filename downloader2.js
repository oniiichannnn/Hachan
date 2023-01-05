// @ For https://asmhentai.com

async function Main () 
{
    const $             = require("node-superfetch");
    const readline      = require("readline");
    const NodeHTMLParse = require("node-html-parser");
    const cli           = require("cli-color");
    const fs            = require("fs");
    const {Axios}         = require('axios');    
    
    const axios = new Axios({
        "headers": {
            "authority": "asmhentai.com",
            "path": "/search/?q=ichiri&page=1",
            "scheme": "https",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\", \"Google Chrome\";v=\"108\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": "_ga=GA1.2.841843357.1671375633; _gid=GA1.2.2014529629.1671375633; PHPSESSID=2100hfkkugi9hq7af9agcjjcqp; _gat_gtag_UA_8082650_36=1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "null",
        "method": "GET"
    })
    
    const { parse } = NodeHTMLParse;
    const {
        art,                beep,               blink, 
        bold,               columns,            erase, 
        getStrippedLength,  inverse,            italic, 
        move,               reset,              slice, 
        strike,             strip,              throbber, 
        underline,          windowSize,         xterm, 
        bgXterm,            xtermSupported,
        
    
        bgBlack,            bgBlackBright,  bgBlue,
        bgBlueBright,       bgCyan,         bgCyanBright,
        bgGreen,            bgGreenBright,  bgMagenta,
        bgMagentaBright,    bgRed,          bgRedBright,
        bgWhite,            bgWhiteBright,  bgYellow,
        bgYellowBright, 
        
    
    
        black,          blackBright,    blue, 
        blueBright,     cyan,           cyanBright,
        green,          greenBright,    magenta, 
        magentaBright,  red,            redBright,      
        white,          whiteBright,    yellow,
        yellowBright
    } = cli;



    const rl            = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    let from_history    = false;


    const SearchQuery = await (async () => {
        return new Promise(resolve => {
            const history = fs.readFileSync("./searchhistory.txt").toString();

            __Log(
                blackBright("================== History ==================") + "\n"+
                "$history$" + "\n"+
                blackBright("Type an index to search a history."),
                
                {
                    history: 
                        history
                            .split("\n")
                            .map((h, i) => {
                                return `${i + 1} ${yellow(h)}`
                            })
                            .join("\n")    
                }
            );


            rl.question(`Type query > `, (answer) => {
                rl.close();

                if (Number(answer) && history.split("\n")[Number(answer) - 1]) {
                    from_history = true;
                    resolve(history.split("\n")[Number(answer) - 1]);
                } else {
                    resolve(answer);
                }
            });
        })
    })();



    await Download(SearchQuery, from_history);



    async function Download (Query, add_to_history) 
    {
        if (!add_to_history) {
            fs.writeFileSync(
                "./searchhistory.txt"
                ,
        
                    `${fs.readFileSync("./searchhistory.txt").toString()}\n`+
                    `${Query}`
            )
        }
    

        __Log(yellow(`[🔍 Searching] ${Query} ...`));
    

        // ## Check if the query is a link
        if (Query.startsWith("https://asmhentai.com/g/")) {
            const Links = Query.split(",");
    
            try {
                for (const link of Links) {
                    await Scrape("gallery", { url: link });
                }
            } catch (e) {
                console.log(e)
                throw new Error("⛔ Invalid gallery link")
            } 
        } else {
            await Scrape("search page", {
                query: Query
            })
        }
    
        console.log("Completed Downloading all images")
    }



    /**
     * 
     * @param {"search page"|"gallery"|"gallery image"} Type 
     * @param {{
     *      query?: string
     *      url?: string
     *      page?: number
     * }} data 
     * @returns {Promise<"SKIP">}
     */
    async function Scrape (Type, data)
    {
        switch (Type) {
            case "search page": 
            {
                let { query, url, page } = data;

                if (!page) page = 1;
                if (url && url.startsWith("https://asmhentai.com/g")) return "SKIP";

                const search_url    = query ? 
                    `https://asmhentai.com/search/?q=${encodeURIComponent(query)}&page=${page}`
                    : 
                    url;


                const raw_html      = await axios.get(search_url);


                const parsed_page   = parse(raw_html.body.toString());


                // Doujin datas
                const doujin_categories = parsed_page.querySelectorAll(".preview_item .cl h3 a:nth-child(1)");
                const doujin_languages  = parsed_page.querySelectorAll(".preview_item .cl a:nth-child(2)");
                const doujin_links      = parsed_page.querySelectorAll(".preview_item .image a").map(
                    url /* /g/417478/ */ => `https://asmhentai.com${url.startsWith("/") ? "" : "/"}${url}`
                );
                const doujin_thumbnails = parsed_page.querySelectorAll(".preview_item .image a img");
                const doujin_titles     = parsed_page.querySelectorAll(".preview_item .image a h2")[0].innerHTML;


                const doujins       = parsed_page
                    .querySelectorAll(".preview_item")
                    .map((doujin, index) => {
                        return {
                            category    : doujin_categories[index],
                            language    : doujin_languages[index],
                            link        : doujin_links[index],
                            thumbnail   : doujin_thumbnails[index],
                            title       : doujin_titles[index]
                        }
                    });

                console.log(doujins);
            } break;
        }
    }



    function __Log (string, variables) {

        if (!variables || Object.keys(variables).length === 0) return console.log(string);

        const ParsedString = string
            .replace(/\$[a-zA-Z0-9 _-]+\$/g, VariableName => {
               
                VariableName = VariableName.slice(1, VariableName.length - 1);

                if (VariableName in variables) {
                
                    return variables[VariableName]
               
                } else 
                
                return VariableName

            });
    
    
        console.log(ParsedString);
    }
}

Main().then();