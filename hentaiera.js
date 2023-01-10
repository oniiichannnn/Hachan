// @ For https://hentaiera.com/search/?key=tamano+kedama&search=&mg=1&dj=1&ws=1&is=1&ac=1&gc=1&en=1&jp=0&es=0&fr=0&kr=0&de=0&ru=0&lt=0&dl=0&pp=0&tr=0

const $             = require("node-superfetch");
const readline      = require("readline");
const NodeHTMLParse = require("node-html-parser");
const cli           = require("cli-color");
const fs            = require("fs");
const ms            = require("ms");
const cp            = require("node:child_process")
const ProgressBar   = require("./ProgressBar.js");



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
    const AutoMode          = process.argv.includes("--auto");
    const CheckImages       = process.argv.includes("--ci") || process.argv.includes("--check-images");
    const IgnoreQueue       = CheckImages || process.argv.includes("--iq") || process.argv.includes("--ignore-queue");

    const MaxPages          = Number(process.argv.find(arg => /--(until|u|mp|maxpage|maxpages)=[0-9]+/.test(arg))?.match(/[0-9]+/)?.[0]) || 0;


    const GalleryURLRegex       = /https:\/\/hentaiera\.com\/gallery\/[0-9]+(\\|)/;
    const SearchResultURLRegex  = /https:\/\/hentaiera\.com\/search\/\?key=[0-9a-zA-Z \w]+/;

    const Queue             = IgnoreQueue ? [] : fs.readFileSync("./queue.txt")
        .toString()
        .split("\n")
        .filter(
            string => 
                GalleryURLRegex.test(string) || SearchResultURLRegex.test(string)
        );

    let   empty_queue       = !(Boolean(Queue[0]));
    let   from_history      = empty_queue || false;

    const history           = fs.readFileSync("./searchhistory.txt").toString();


    const SearchQuery       = (!CheckImages && empty_queue) ? 
        await PromptQuery() 
        : 
        null;

    console.clear();


    if (!from_history)  fs.writeFileSync("./searchhistory.txt", `${history}\n${SearchQuery}`);
    if (AutoMode)       console.log(bgYellow.black("⚡ Auto Mode On"));
    if (!empty_queue)   console.log("==> Downloading queue galleries");
    if (CheckImages)    console.log("==> Performing gallery images check");



    if (MaxPages > 0) __log(`==> Set max pages as ${yellowBright(MaxPages)}`);
    if (MaxPages > 0) __log(`==> All downloads will stop at ${yellowBright(`page ${MaxPages}`)}`);
    if (empty_queue)  __log(`==> Searching ${yellowBright(SearchQuery)} ...`);

    

    let TotalFoundDoujins = 0;
    let Pages;
    let DownloadedDirectlyFromGalleryURL = false;

    const DoujinCategories  = [];
    const DoujinLanguages   = [];
    const DoujinThumbnails  = [];
    const DoujinTitles      = [];
    const DoujinPages       = [];
    const DoujinLinks       = [];

    const DoujinsToDownload     = [];
    let   PresetPages           = 0;



    if (CheckImages) {
        const ImageDirsForChecking = fs.readdirSync("./images").filter(dir => !dir.startsWith("!"));
        let CurrentlyCheckedImageIndex = 0;
    
        for (const dir of ImageDirsForChecking) {
            CurrentlyCheckedImageIndex++;
    
            const percentage    = ((CurrentlyCheckedImageIndex / ImageDirsForChecking.length) * 100).toFixed(2);
            const label         = 
                `${padding(CurrentlyCheckedImageIndex, ImageDirsForChecking.length.toString().length)}`+
            
                " / "+
            
                `${ImageDirsForChecking.length} ${yellowBright(`${padding(percentage, 5)}%`)}`;
    
            const gid               = dir;
            const dir_pages         = await GalleryPages(`https://hentaiera.com/gallery/${gid}`);
            const downloaded_images = fs.readdirSync(`./images/${dir}`).length;
    
            if (dir_pages !== downloaded_images) {
                console.log(`[${label} ${magenta("Checked")}] Gallery: ${padding(gid, 10)} | Status: ${red("Missing")} | Missing: ${red(downloaded_images - dir_pages)}`);
    
                DoujinsToDownload.push(`https://hentaiera.com/gallery/${gid}`);
    
                PresetPages += dir_pages;
            } else {
                console.log(`[${label} ${magenta("Checked")}] Gallery: ${padding(gid, 10)} | Status: ${green("Complete")}`);
            }
        }




        console.log(`==> ${yellowBright(DoujinsToDownload.length)} galleries needed to be re-downloaded`);
        
        AddToQueue(DoujinsToDownload);

        console.log(`==> added ${yellowBright(DoujinsToDownload.length)} galleries to queue`);
    }


    if (GalleryURLRegex.test(SearchQuery)) {
        console.log(`==> Detected gallery URL as search query`);
        console.log(`==> Downloading from ${yellowBright(SearchQuery)}`);
        console.log(`==> Detected ${yellowBright(SearchQuery.split(",").length)} urls`);


        DownloadedDirectlyFromGalleryURL = true;


        DoujinsToDownload.push(...SearchQuery.split(",").map(url => url.trim()));
    } else {
        if (!empty_queue) {
            const GalleryURLS       = Queue.filter(url => GalleryURLRegex.test(url));
            const SearchQueryURLS   = Queue.filter(url => SearchResultURLRegex.test(url));



            console.log("==> Gathering gallery URLs from all search result URLs");

            for (let i = 0 ; i < SearchQueryURLS.length ; i++) {
                const SearchQueryURL = SearchQueryURLS[i];

                console.log(`[${i + 1}/${SearchQueryURLS.length}] Gathering gallery URLs from ${SearchQueryURL}`);
                console.log("\n")
                await GetAllGalleryURLS(SearchQueryURL);
                console.log("\n\n\n")

                TotalFoundDoujins   = 0;
                Pages               = undefined;
            }

            console.log("==> ✅ Gathered all gallery URLs");
            console.log(`==> Found ${yellowBright([...GalleryURLS, ...DoujinLinks].length)} gallery urls`);

            for (const GalleryURL of GalleryURLS) {
                DoujinPages.push(await GalleryPages(GalleryURL));
                DoujinLinks.push(GalleryURL);
                
                DoujinsToDownload.push(GalleryURL);
            }

            DoujinsToDownload.push(...DoujinLinks);
        } else
        
        if (!CheckImages) {
            await GetAllGalleryURLS(SearchQuery);
            await FilterDoujins();
        }
    }



    if ((DoujinsToDownload.length === 0)) {
        console.log(bgRed.black("[Error] 0 doujins to download"));

        process.kill(process.pid);
    };


    let CurrentDoujin           = 0;
    let PreviousDownloadTime    = 0;
    let DownloadTime            = 0;
    let TotalDownloadTime       = 0;
    let DownloadedImages        = 0;
    let TotalImages             = MaxPages > 0 ? 
        MaxPages * DoujinsToDownload.length 
        : 
        (
            DoujinsToDownload
                .reduce((previous, current) => {
                    return previous + Number(DoujinPages[DoujinLinks.indexOf(current)])
                }, 0)
            ||
                PresetPages
        );


    const ImageDirs = fs.readdirSync("./images").filter(dir => !dir.startsWith("!"));



    rl.question("", action => {
        if (action.startsWith("-q")) {
            const query = action.slice("-q".length).trim();

            AddToQueue(query);
            console.log(`✅ Added ${yellowBright(query)} to queue`)
        } else

        if (action.startsWith("-queue")) {
            const query = action.slice("-queue".length).trim();

            AddToQueue(query);
            console.log(`✅ Added ${yellowBright(query)} to queue`)
        }
    });





    if (DownloadedDirectlyFromGalleryURL) {
        for (const url of DoujinsToDownload) {
            TotalImages += await GalleryPages(url);
        }
    }


    for (const Link of DoujinsToDownload) {
        const todo = await DownloadGallery(Link);
        
        if (todo === "continue") continue;
    }

    console.log(green(`==> ✅ Downloaded ${TotalImages} images`));
    rl.close();

    // if (empty_queue) {
    //     await CheckQueueAndDownload();
    // } else {
    //     fs.writeFileSync("./queue.txt", "");
    // }

    if (!IgnoreQueue) {
        fs.writeFileSync("./queue.txt", "");
    }


    function AddToQueue (query) 
    {
        if (Array.isArray(query)) query = query.join("\n");

        const CurrentQueue = fs.readFileSync("./queue.txt");

        if (CurrentQueue === "") {
            fs.writeFileSync("./queue.txt", `${query}`);
        } else {
            fs.writeFileSync("./queue.txt", `${CurrentQueue}\n${query}`);
        }
    }

    async function GalleryPages (GalleryURL) 
    {
        try {
            const request   = await $.get(GalleryURL);
            const body      = request.body.toString();
            const document  = parse(body);
    
            return Number(document.querySelector(".btn.btn_colored").innerText.trim().match(/[0-9]+/)[0]);
        } catch {
            return await GalleryPages(GalleryURL);
        }
    }

    async function GetAllGalleryURLS (SearchQuery)
    {
        await ScrapeSearchResultsPage(SearchQuery, false, 1);
    
        for (let i = 2 ; i < (Number(Pages) + 1) ; i++) { await ScrapeSearchResultsPage(SearchQuery, false, i); };
    }

    async function CheckQueueAndDownload ()
    {
        const RawQueue = fs.readFileSync("./queue.txt").toString();

        if (RawQueue.length !== 0) {
            cp.execSync(`cls;node hentaiera.js`, {stdio: 'inherit'});
        }
    }

    async function DownloadGallery (Link)
    {
        CurrentDoujin++;

        const GalleryId = Link.match(/gallery\/[0-9]+/)[0].split("/")[1];

        let request;

        try {
            request = await $.get(`https://hentaiera.com/view/${GalleryId}/1/`);
        } catch (e) {
            console.log(`[${red("ERROR")}] ${yellowBright(`https://hentaiera.com/view/${GalleryId}/1/`)} does not exist`);
            console.log(e);
        }


        const body      = request.body.toString();
        const document  = parse(body);


        const ImageURLs = [];


        const Title     = DoujinTitles[DoujinLinks.indexOf(Link)];
        const Images    = MaxPages > 0 ? 
            MaxPages 
            : 
            Number(document.querySelector("span.total_pages").innerHTML);


        let ExistingImageFiles = 0;
        if (ImageDirs.includes(GalleryId)) {
            const ImageFiles = fs.readdirSync(`./images/${GalleryId}`);

            ExistingImageFiles = ImageFiles.length;

            if (Images === ImageFiles.length) {
                console.log(`${__gallery_index()} ${yellowBright("Skipping")}`);
                
                DownloadedImages += ImageFiles.length;

                return "continue";
            }
        }

        const ImageURL = document.querySelector("img#gimg").attributes["data-src"];


        __log(`\n\n${__gallery_index()} Found ${yellowBright(Images)} images`);


        const format = () => {
            const ImagesLeft            = new Intl.NumberFormat().format((TotalImages || 0) - (DownloadedImages || 0));
            // const DownloadTimeInSeconds = (((TotalDownloadTime / DownloadedImages) / 1000) || 0).toFixed(2);
            const DownloadTimeInSeconds = (DownloadTime / 1000).toFixed(2);


            const CurrentGalleryIndex   = magenta(padding(CurrentDoujin, DoujinsToDownload.length.toString().length));
            const Galleries             = DoujinsToDownload.length;

            const FormattedImagesLeft   = yellowBright(padding(ImagesLeft, TotalImages.toString().length));

            const DownloadSpeed = PreviousDownloadTime > DownloadTime ? 
                green("↑") 
                : 
                PreviousDownloadTime === DownloadTime ?
                    whiteBright("-")
                    :
                    red("↓");


            const percent = padding(((DownloadedImages / TotalImages) * 100).toFixed(2), 6);
            
            return (
                `[${CurrentGalleryIndex} / ${Galleries}]`+
                
                " "+

                `${GalleryId}`+
                
                " "+

                `(${redBright("{value}")} / {total})`+

                " "+

                `${yellowBright("{percentage}%")}`+
                
                " "+

                `Downloading |{bar}|`+
                
                " "+

                `${FormattedImagesLeft} images left (${magenta(`${percent}%`)})`+
                
                " | "+
                
                `${yellowBright( `${padding(DownloadTimeInSeconds, 5)}/s` )} ${DownloadSpeed}`+
                
                " | "+
                
                `${blackBright(RemainingTime())}`
            );
        }

        const Progress = new ProgressBar({
            format              : format,
            
            current             : 0,
            max                 : Images,

            empty_barchar       : " ",
            progress_barchar    : red("#")
        });

        Progress.formatter();


        if (!fs.existsSync(`./images/${GalleryId}/`)) {
            fs.mkdirSync(`./images/${GalleryId}/`)
        }


        if (ExistingImageFiles === 0) {
            ImageURLs.push(ImageURL);


            const extension = ImageURL.split(".").at(-1);
    
    
            fs.writeFileSync(`./images/${GalleryId}/1.${extension}`, (await $.get(ImageURL)).body);
            
            DownloadedImages++;
            Progress.increment();
        } else {
            DownloadedImages += ExistingImageFiles;

            console.log(`${__gallery_index()} ${greenBright("==> Starting at index")} ${green(ExistingImageFiles)}`);
            Progress.set(ExistingImageFiles);
        }




        // Scrape image from page
        for (
            let page = (ExistingImageFiles + 1); 
            
            page < (MaxPages > 0 ? MaxPages : Number(Images)); 
            
            page++
        ) {
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
            DownloadTime        = DownloadedTime - StartTime;
            TotalDownloadTime   += DownloadTime;

            Progress.increment();

            PreviousDownloadTime = DownloadTime;

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


            if (DoujinTitles.length > 1) {
                await Console();
                console.clear();
            } else {
                console.log(`==> Only ${yellowBright(1)} doujin in search result`);
                console.log(`==> Auto downloading ...`);
                list.push(0);
            }
        }


        if (!list[0]) {
            console.log(`==> Downloading all doujins`);

            DoujinsToDownload.push(...DoujinLinks);
        } else {
            DoujinsToDownload.push(...DoujinLinks.filter((_, i) => list.includes(i)));
        }


        console.log("==> Starting download ...");


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
        const url = /https:\/\/hentaiera\.com\/search\/\?key=[0-9a-zA-Z \w]+/.test(query) ? 
            query 
            : 
            __construct_url(query, english, page);


        if (/https:\/\/hentaiera\.com\/search\/\?key=[0-9a-zA-Z \w]+/.test(query)) console.log(`==> Link detected as query, using ${yellowBright(query)} as url`);

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
            Pages = document.querySelectorAll("a.page-link")?.at(-2)?.innerHTML || 1;
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
            console.log("\n");
            console.log(`${bgWhite.black("Tip")} You can paste gallery links to directly download a gallery.`);
            console.log(`${bgWhite.black("Tip")} You can paste search result links.`);
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



    function __gallery_index ()
    {
        const current = padding(CurrentDoujin, DoujinsToDownload.length.toString().length);

        return `[${magenta(current)} / ${DoujinsToDownload.length}]`;
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

    function padding (string, topad) 
    {
        if (typeof string !== "string") string = string.toString();

        let new_string = "";

        for (let i = 0 ; i < (topad - string.length) ; i++) {
            new_string += " ";
        }

        new_string = `${new_string}${string}`;

        return new_string
    }
}

Main().then();