// @ For https://hentaiera.com/search/?key=tamano+kedama&search=&mg=1&dj=1&ws=1&is=1&ac=1&gc=1&en=1&jp=0&es=0&fr=0&kr=0&de=0&ru=0&lt=0&dl=0&pp=0&tr=0

const $             = require("node-superfetch");
const readline      = require("readline");
const NodeHTMLParse = require("node-html-parser");
const cli           = require("cli-color");
const fs            = require("fs");
const { Axios }     = require('axios');    
const cliProgress   = require('cli-progress');
const ms            = require("ms");
const child_process = require("child_process");


const pms = require("./pretty-ms/index.js");


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



const rl = readline.createInterface({
    input   : process.stdin,
    output  : process.stdout,
    terminal: false
});



async function Main () 
{
    let   from_history      = false;

    const AutoMode          = process.argv.includes("auto");
    const history           = fs.readFileSync("./searchhistory.txt").toString();


    const SearchQuery = await PromptQuery();

    console.clear();


    if (!from_history)  fs.writeFileSync("./searchhistory.txt", `${history}\n${SearchQuery}`);
    if (AutoMode)       console.log(bgYellow.black("⚡ Auto Mode On"));



    __log(`==> Searching ${yellowBright(SearchQuery)} ...`);

    

    let TotalFoundDoujins = 0;
    let Pages;

    const DoujinCategories  = [];
    const DoujinLanguages   = [];
    const DoujinThumbnails  = [];
    const DoujinTitles      = [];
    const DoujinPages       = [];
    const DoujinLinks       = [];

    const DoujinsToDownload = [];



    await ScrapeSearchResultsPage(SearchQuery, false, 1);

    for (let i = 2 ; i < (Number(Pages) + 1) ; i++) { await ScrapeSearchResultsPage(SearchQuery, false, i); }
    


    await FilterDoujins();


    if (DoujinsToDownload.length === 0) {
        console.log(bgRed.black("[Error] 0 doujins to download"));

        process.kill(process.pid);
    };


    let CurrentDoujin       = 0;
    let DownloadTime        = 0;
    let DownloadedImages    = 0;
    let TotalImages         = DoujinsToDownload.reduce((previous, current) => {
        return previous + Number(DoujinPages[DoujinLinks.indexOf(current)])
    }, 0);


    const ImageDirs = fs.readdirSync("./images");

    for (const Link of DoujinsToDownload) {
        CurrentDoujin++;

        const GalleryId = Link.match(/gallery\/[0-9]+/)[0].split("/")[1];

        const request   = await $.get(`https://hentaiera.com/view/${GalleryId}/1/`);
        const body      = request.body.toString();
        const document  = parse(body);


        const ImageURLs = [];


        const Title     = DoujinTitles[DoujinLinks.indexOf(Link)];
        const Images    = Number(document.querySelector("span.total_pages").innerHTML);


        let ExistingImageFiles = 0;
        if (ImageDirs.includes(GalleryId)) {
            const ImageFiles = fs.readdirSync(`./images/${GalleryId}`);

            ExistingImageFiles = ImageFiles.length;

            if (Images === ImageFiles.length) {
                console.log(`[${CurrentDoujin} / ${DoujinsToDownload.length}] ${yellowBright("Skipping")}`);
                
                DownloadedImages += ImageFiles.length;

                continue;
            }
        }

        const ImageURL = document.querySelector("img#gimg").attributes["data-src"];


        __log(`[${CurrentDoujin} / ${DoujinsToDownload.length}] Found ${yellowBright(Images)} images`);


        const format = (GalleryID) => {
            return `[${CurrentDoujin} / ${DoujinsToDownload.length}] ${GalleryID} ({value} / {total}) ${yellowBright("{percentage}%")} Downloading |{bar}| ${blackBright(`${RemainingTime()} | ${new Intl.NumberFormat().format((TotalImages || 0) - (DownloadedImages || 0))} images left (${(DownloadTime / 1000).toFixed(2)}s per download)`)}\n`;
        }

        const b1 = new cliProgress.SingleBar({
            // format              : `[${CurrentDoujin} / ${DoujinsToDownload.length}] ({value} / {total}) ${yellowBright("{percentage}%")} Downloading |{bar}|\n`,
            format              : format(GalleryId),
            barCompleteChar     : '#',
            barIncompleteChar   : ' ',
            hideCursor          : true,
            autopadding         : true
        });

        b1.start(Images, 0, { speed: "N/A" });


        if (!fs.existsSync(`./images/${GalleryId}/`)) {
            fs.mkdirSync(`./images/${GalleryId}/`)
        }


        if (ExistingImageFiles === 0) {
            ImageURLs.push(ImageURL);


            const extension = ImageURL.split(".").at(-1);
    
    
            fs.writeFileSync(`./images/${GalleryId}/1.${extension}`, (await $.get(ImageURL)).body);
            
            DownloadedImages++;
            b1.increment();
        } else {
            DownloadedImages += ExistingImageFiles;

            console.log(`\n[${CurrentDoujin} / ${DoujinsToDownload.length}] Starting at index ${yellowBright(ExistingImageFiles)}`);
            b1.update(ExistingImageFiles);
        }




        // Scrape image from page
        for (let page = (ExistingImageFiles + 1) ; page < Number(Images) ; page++) {
            const request   = await $.get(`https://hentaiera.com/view/${GalleryId}/${page + 1}/`);
            const body      = request.body.toString();
            const document  = parse(body);
    
            const ImageURL = document.querySelector("a.next_img img").attributes["data-src"];
    
            ImageURLs.push(ImageURL);

            const extension = ImageURL.split(".").at(-1);


            let StartTime = Date.now();
            await DownloadImage();
            let DownloadedTime = Date.now();


            DownloadedImages++;
            DownloadTime = DownloadedTime - StartTime;

            // console.log(yellowBright(`\n\n${RemainingTime()}`));
            b1.options.format = format(GalleryId);
            b1.increment(undefined, { speed: DownloadTime || 0 });

            async function DownloadImage ()
            {
                try {
                    fs.writeFileSync(`./images/${GalleryId}/${page + 1}.${extension}`, (await $.get(ImageURL)).body);
                } catch (error) {
                    console.log(bgRed.black(`[ERROR] Failed to download image: ${error.message}`));
                    console.log("Retrying ...");
                    
                    await DownloadImage();
                }
            }
        }


        function RemainingTime () {
            return pms(((TotalImages || 0) - (DownloadedImages || 0)) * (DownloadTime || 0), { verbose: true });
        }
    }




    async function FilterDoujins () 
    {
        let list = [];



        if (AutoMode) {
            console.log(`[⚡ Auto Mode] Downloading ${yellowBright("English")} only doujins`);

            DoujinLanguages.forEach((lang, index) => {
                if (lang.includes("english")) {
                    list.push(index);
                    __log(`✅ added ${yellowBright(DoujinTitles[index])}`);
                }
            });
        } else {
            __log(blackBright("============================="));
            __log(
                DoujinTitles
                    .map((title, index) => {
                        const i = index + 1 < 10 ? 
                            ` ${index + 1}` 
                            : 
                            index + 1;
    
                        return `${i}. ${yellowBright(title)}${i % 3 === 0 ? "\n\n" : "\n"}`
                    })
                    .join("")
            )
            __log(blackBright("============================="));
            console.log(
                `${bgWhite.black("view [index]")}                    - view info about a doujin.\n`,
                `${bgWhite.black("download [index]")}                - add doujin to download list.\n`,
                `${bgWhite.black("clear")}                           - clear current download list.\n`,
                `${bgWhite.black("remove [download list index]")}    - remove a doujin from download list.\n`,
                `${bgWhite.black("list")}                            - view download list.\n`,
                `${bgWhite.black("download [index]-[index]")}        - add doujin from index to index, example: 1-9 will download doujin 1 to 9.\n`,
                `${bgWhite.black("download all english")}            - add all english doujins.\n`,
                
                "\n\n",
    
                `Hit ${bgWhite.black("Enter")} to complete.`
            );

            await Console();
        }

        console.log("Starting download ...")

        DoujinsToDownload.push(...DoujinLinks.filter((_, i) => list.includes(i)));
        return;

        async function Console ()
        {
            const input = await (async () => {
                return new Promise(resolve => {
                    rl.question(`${bgWhite.black(">")} `, (answer) => {
                        resolve(answer);
                    })
                });
            }) ();

            const args  = input.split(/ +/g);

            switch (args[0]) {
                case "view": {
                    const DoujinIndex = Number(args[1]) - 1;

                    console.log(
                        "\n\n",
                        "========== Doujin Information ==========\n",
                        `${yellowBright(DoujinTitles[DoujinIndex])}\n`,
                        blackBright(DoujinThumbnails[DoujinIndex]) + "\n",
                        blackBright(DoujinLinks[DoujinIndex]) + "\n",
                        `${DoujinLanguages[DoujinIndex]} • ${DoujinPages[DoujinIndex]} Pages\n`,
                        "\n\n",
                        `${DoujinCategories[DoujinIndex]}\n`,
                        "========================================"
                    )

                    await Console();
                } break;

                case "download": {
                    const DoujinIndex = Number(args[1]) - 1;

                    if (args[1].includes("-")) {
                        const DoujinIndex__From = Number(args[1].split("-")[0]);
                        const DoujinIndex__To   = Number(args[1].split("-")[1]);

                        for (let i = (Number(DoujinIndex__From) - 1) ; i < (Number(DoujinIndex__To)) ; i++) {
                            list.push(i);
                            __log(`✅ added ${yellowBright(DoujinTitles[i])}`);
                        }
                    } else

                    if (input.includes("eng")) {
                        DoujinLanguages.forEach((lang, index) => {
                            if (lang.includes("english")) {
                                list.push(index);
                                __log(`✅ added ${yellowBright(DoujinTitles[index])}`);
                            }
                        });

                        await Console();
                    } else {
                        list.push(DoujinIndex);
    
                        __log(`✅ added ${yellowBright(DoujinTitles[DoujinIndex])}`);
    
                        await Console();
                    }
                } break;

                case "clear": {
                    list = [];

                    __log(`✅ cleared list`);

                    await Console();
                } break;

                case "remove": {
                    const DoujinIndex = Number(args[1]) - 1;

                    __log(`✅ removed ${yellowBright(DoujinTitles[list[DoujinIndex]])}`);

                    list.splice(DoujinIndex, 1);

                    await Console();
                } break;

                case "list": {
                    console.log(
                        "========== Download List ==========\n",
                        list
                            .map((did, index) => {
                                return `${index + 1} ${yellowBright(DoujinTitles[did])}`
                            })
                            .join("\n") + "\n",
                        "==================================="
                    )

                    await Console();
                } break;

                default: return "DONE";
            }
        }
    }

    async function ScrapeSearchResultsPage (query, english, page) 
    {
        const url = __construct_url(query, english, page);

        const request   = await $.get(url);
        const body      = request.body.toString();
        const document  = parse(body);


        const Categories    = document.querySelectorAll("h3.gallery_cat")
            .map(el => el.innerHTML);
        const Languages     = document.querySelectorAll("div.lang_pages a")
            .map(el => el.attributes.href.split("/")[2]);
        const Thumbnails    = document.querySelectorAll("div.inner_thumb a img")
            .map(el => el.attributes.src);
        const Titles        = document.querySelectorAll("h2.gallery_title a")
            .map(el => el.innerHTML);
        const PagesCount    = document.querySelectorAll("span.inside_p")
            .map(el => el.innerHTML);
        const Links         = document.querySelectorAll("div.inner_thumb a")
            .map(el => `https://hentaiera.com${el.attributes.href.endsWith("/") ? "" : "/"}${el.attributes.href}`);
        
        DoujinCategories.push(...Categories);
        DoujinLanguages.push(...Languages);
        DoujinThumbnails.push(...Thumbnails);
        DoujinTitles.push(...Titles);
        DoujinPages.push(...PagesCount);
        DoujinLinks.push(...Links);


        TotalFoundDoujins += Categories.length;

        if (page === 1) {
            Pages = document.querySelectorAll("a.page-link").at(-2).innerHTML;
            __log(`[Search Result] Found ${yellowBright(Pages)} pages`)
        }

        __log(`[Search Result] Page ${yellowBright(page)} found ${yellowBright(Categories.length)} doujins (${TotalFoundDoujins} total)`);
    }

    async function PromptQuery ()
    {
        return new Promise(resolve => {
            const history = fs.readFileSync("./searchhistory.txt").toString();

            __log(
                blackBright("================== History =================="),
                
                `${
                    history
                            .split("\n")
                            .map((h, i) => {
                                return `${i + 1} ${yellow(h)}`
                            })
                            .join("\n")  
                }`,

                blackBright("=============================================")
            );


            console.log(`Type an ${bgWhite.black("index")} to use that query.`);
            console.log(`${bgWhite.black("Enter")} to use the last query.`);
            console.log("\n\n");


            if (AutoMode) resolve(history.split("\n").at(-1));

            rl.question(`${bgWhite.black(">")} `, (answer) => {
                if (Number(answer) && history.split("\n")[Number(answer) - 1]) {
                    from_history = true;
                    resolve(history.split("\n")[Number(answer) - 1]);
                } else {
                    if (answer.length === 0) {
                        from_history = true;

                        resolve(history.split("\n").at(-1));
                    } else {
                        resolve(answer);
                    }
                }
            });
        })
    }




    function __construct_url (query, english, page) 
    {
        if (english) return `https://hentaiera.com/search/?key=${query.replace(/ +/, "+")}&search=&mg=1&dj=1&ws=1&is=1&ac=1&gc=1&en=1&jp=0&es=0&fr=0&kr=0&de=0&ru=0&lt=0&dl=0&pp=0&tr=0&page=${page || 1}`;

        return `https://hentaiera.com/search/?key=${query.replace(/ +/, "+")}&page=${page || 1}`;
    }

    function __log ()
    {
        console.log(Array.from(arguments).join("\n"));
    }
}

Main().then();