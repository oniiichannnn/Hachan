const $             = require("node-superfetch");
const NodeHTMLParse = require("node-html-parser");
const cli           = require("cli-color");
const fs            = require("fs");
const Settings      = require("../settings.json");
const readline      = require("readline");



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



module.exports = async function ( HTMLContent , WebSocketClient, urls ) {
    const Counters = new Map();


    let SearchResults = [];
    let isQueued = false;


    // Normal search query.
    if (HTMLContent) {
        const ParsedHTMLContent = parse(HTMLContent);


        const MaxPages = Math.ceil( Number(ParsedHTMLContent.querySelector("div.searchtext").innerText.match(/[0-9]+/)[0]) / 25);
        let NextPage


        for (let i = 0 ; i < MaxPages ; i++) {
        
            if (i === 0) {
                await Search(HTMLContent);
            } else 
            
            if (NextPage) {
                const Response = await $.get(NextPage);

                const HTMLContent = Response.body.toString();

                await Search(HTMLContent);
            } else {

                __Log(
                    red(`⛔ At page $page$ : could not find url to next page`), {
                        page    : yellow(`${i + 1}/${MaxPages}`)
                    }
                );

            }
        }
        
        async function Search (HTMLContent) {
            const ParsedHTMLContent = parse(HTMLContent);
            const Parents           = ParsedHTMLContent.querySelectorAll(".gl3c.glname");
        

            SearchResults.push(...Parents
                .map((Parent, i) => {
                    const ChildElement  = Parent.childNodes[0];
                    // const URL           = ChildElement.rawAttrs.match(/https:\/\/e-hentai\.org\/[a-zA-Z0-9 \W]+\/$/)[0];
        
                    return {
                        link: ChildElement._rawAttrs.href,
                        title: ParsedHTMLContent.querySelectorAll(".glink")[i].text
                    };
                }));

            NextPage = ParsedHTMLContent.querySelector("#unext")?.attributes?.href;
        }
    } else {
        SearchResults = await (async () => {
            let Results = [];

            for (const url of urls) {
                try {
                    const Page          = await $.get(url);
                    const ParsedPage    = parse(Page.body.toString());

                    Results.push({
                        link: url,
                        title: ParsedPage.querySelector("h1#gn").text
                    });
                } catch (error) {
                    throw error;
                }
            }

            isQueued = true;

            return Results
        }) ();
    }




    const ImagesData        = [];
    const GalleryCounter    = NewCounter();
    const PageLinks         = SearchResults.map(r => r.link);

        
    __Log(
        green("🔍 Found $results$ results"), {
            results: PageLinks.length
        }
    );



    if (SearchResults.length === 0) return __Log(red(`⛔ 0 results found`))

    const DoujinsToDownload = isQueued ? 
        SearchResults 
        
        :

        (await (async () => {
            return new Promise(resolve => {
                const rl        = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    terminal: false
                });

                __Log(
                    blackBright(
                        "$Search_Results$"+ 
                        "\n\n"+
                        cyan("Type 1, 2, 3 to download doujin 1, 2, 3. Type \"all\" or leave blank to download all.")
                    ), {
                        Search_Results:
                            SearchResults
                                .map((res, i) => {
                                    return (
                                        `${i + 1}. ${yellow(res.title)}\n`+
                                        `     ${blackBright(res.link)}\n`
                                    )
                                })
                                .join("\n")
                    }
                );


                rl.question(yellow("Doujin(s) to download > "), (answer) => {
                    rl.close();

                    if ((answer.toLowerCase().includes("all") || answer.length === 0)) {
                        __Log(blackBright("➡️ Selected all doujins"))
                    } else {
                        __Log(blackBright("➡️ Filtering doujins ..."))
                    }

                    const indexes = (answer.toLowerCase().includes("all") || answer.length === 0) ? 
                        true
                        :
                        answer.includes(",") ?
                            answer.split(",").map(a => Number(a))
                            :
                            [Number(answer)];


                    resolve(
                        SearchResults
                            .filter((x, index) => {
                                return (indexes === true) || (indexes.includes(index + 1))
                            })
                    )
                });
            })
        }) ());


    __Log(
        green("🔽 ========== Downloading ========== 🔽\n")+
        "$titles$\n"+
        green("=========================================="), 
        
        {
            titles: DoujinsToDownload
                .map(
                    (d, i) => yellow(`${i + 1} ${d.title}`)
                )
                .join("\n")
    })



    // ## Scraping page links from galleries
    for (
        const PageLink 
            of 
        DoujinsToDownload
            .map(a => a.link)
    ) {
        AddCounter(GalleryCounter);



        const Index         = Count(GalleryCounter);
        const ImageLinks    = [];
        const AllLinks      = [];



        __Log(
            "[" + redBright("Gallery $gallery$ ⋅ Page 0/?? ⋅ (0/??)") + " : " + blackBright(PageLink) + "] Fetching gallery ...", 
            
            {
                gallery: `${Index}/${PageLinks.length}`
            }
        )


        let Page          = await $.get(PageLink);
        let ParsedPage    = parse(Page.body.toString());


        __Log(
            "[" + green(redBright("Gallery $gallery$ ⋅ Page 0/?? ⋅ (0/??)") + " : " + blackBright(PageLink) + "] ✅ Successfully fetched page"),

            {
                gallery: `${Index}/${PageLinks.length}`
            }
        )


        const GalleryPages = Math.ceil(
            Number(ParsedPage
                .querySelector(".gtb")
                .childNodes[0]
                .innerHTML
                .match(/[0-9]+ images/)[0]
                .match(/[0-9]+/)[0]) 
                
                / 40
        );


        // https://e-hentai.org/g/2385294/7270316375/
        const GalleryID     = PageLink.split("/")[4];
        const GalleryToken  = PageLink.split("/")[5];


        const FolderName            = `${GalleryID}-${GalleryToken}`;
        // const FolderName         = `${GalleryID}&${GalleryToken}--GAP--${querytitle}`;
        const IllegalRegex          = /[/\\?%*:|"<>]/g;
        const CleanFolderName       = FolderName.replace(IllegalRegex, "-");


        
        const startfromdata = (fs.existsSync(`./images/${GalleryID}-${GalleryToken}`)) ?
            (() => {
                if (fs.existsSync(`./images/${CleanFolderName}`)) {
                    return fs.readdirSync(`./images/${CleanFolderName}`)
                        .sort((a,b) => {
                            const a1 = a.match(/[0-9]+/)[0];
                            const b1 = b.match(/[0-9]+/)[0];
        
                            return b1 - a1
                        })
                        [0]
                } else {
                    return fs.readdirSync(`./images/${GalleryID}-${GalleryToken}`)
                        .sort((a,b) => {
                            const a1 = a.match(/[0-9]+/)[0];
                            const b1 = b.match(/[0-9]+/)[0];
        
                            return b1 - a1
                        })
                        [0]
                }
            }) ()
            :
            undefined;

        const startfrom_page = startfromdata ?
                Math.floor(
                    Number(
                        startfromdata
                            .match(/[0-9]+/)[0]
                    ) / 40
                )
            : 
            0;

        const startfrom_inner_page = startfromdata ? 
            Math.floor(
                Number(startfromdata.match(/[0-9]+/)[0]) - (startfrom_page * 40)
            )
            
            :

            0;



        if (startfromdata) {
            console.log(yellow(`[${redBright(`Gallery ${Index}/${PageLinks.length} ⋅ Page 0/? ⋅ (0/?)`)} : ${blackBright(PageLink)}] Starting from page ${startfrom_page} (${startfrom_inner_page})`))
        }
        if (startfrom_page === GalleryPages) {
            const alreadylastpage = await FetchImages(GalleryPages - 1, 0, true, startfrom_inner_page);

            if (alreadylastpage) {
                console.log(yellow(`[${redBright(`Gallery ${Index}/${PageLinks.length} ⋅ Page 0/? ⋅ (0/?)`)} : ${blackBright(PageLink)}] ⏭️ Skipping`));

                continue;
            }
        }

        for (let i = startfrom_page ; i < GalleryPages ; i++) {
            let retriedCount = 0;

            try {
                if (retriedCount === 10) return __Log("Gave up");


                await FetchImages(i, Index);
            } catch (e) {
                retriedCount++

                __Log(e.message);
                __Log(`[${redBright(`Gallery ${Index}/${PageLinks.length} ⋅ Page 0/? ⋅ (0/?)`)} : ${retriedCount}/10] Retrying ...`);

                await FetchImages(i, Index);
            }
        }

        async function FetchImages (page, galleryindex, checking, inner) {
            // https://e-hentai.org/g/2231376/a7584a5932/?p=1

            if (page !== 1) {
                Page          = await $.get(
                    // page starts counting from 0
                    `${PageLink}${PageLink.endsWith("/") ? "" : "/"}?p=${page}`
                );
                ParsedPage    = parse(Page.body.toString());
            }


            const ImagePageLinkElements = ParsedPage.querySelectorAll(".gdtm div a");

            // "https://e-hentai.org/s/86b61be19c/2385294-40"
            const PageURLS = ImagePageLinkElements
                .map(PageLinkElement => {
                    const URL = PageLinkElement.rawAttrs.match(/https:\/\/e-hentai\.org\/[a-zA-Z0-9 \W]+/)[0].slice(0, -1);
                    
                    return URL;
                })
            
    
    
    
            if (checking) {
                return PageURLS.length === inner
            }
    
            __Log(green(`[${redBright(`Gallery ${galleryindex}/${PageLinks.length} ⋅ Page ${page + 1}/${GalleryPages} ⋅ (${Index}/${PageLinks.length})`)} : ${blackBright(PageLink)}] 🔍 Found ${PageURLS.length} pages`));
            __Log("\n");
            __Log(`[${redBright(`Gallery ${galleryindex}/${PageLinks.length} ⋅ Page ${page + 1}/${GalleryPages} ⋅ (${Index}/${PageLinks.length})`)}] : ${blackBright(PageLink)}] Fetching page images ...`);
    
    
    
    
            const PageCounterID = NewCounter(startfrom_page === page ? startfrom_inner_page : 0);

    
            // ## Fetching images from pages
            for (
                let i = startfrom_page === page ? startfrom_inner_page : 0 ; 
            
                i < PageURLS.length ; 
                i++
            ) {
                const PageLink = PageURLS[i];

                AddCounter(PageCounterID);
        
        
                const Index = Count(PageCounterID);
    
    
                __Log(`[${redBright(`Gallery ${galleryindex}/${PageLinks.length} ⋅ Page ${page + 1}/${GalleryPages} ⋅ (${Index}/${PageLinks.length})`)} : ${blackBright(PageLink)}] Fetching image page ...`);
        
        
                const Page          = await $.get(PageLink);
                const ParsedPage    = parse(Page.body.toString());
        
        
                __Log(green(`[${redBright(`Gallery ${galleryindex}/${PageLinks.length} ⋅ Page ${page + 1}/${GalleryPages} ⋅ (${Index}/${PageLinks.length})`)} : ${blackBright(PageLink)}] ✅ Successfully fetched page`))
        
        
                const ImageLinkElement  = ParsedPage.querySelector("div#i3 a img");
                const Attributes        = ImageLinkElement.rawAttrs.split('"');


                const SrcLabel = Attributes.find(Attr => {
                    return Attr.trim() === "src="
                });
        
                const IndexOfSrcLabel   = Attributes.indexOf(SrcLabel);
                const ImageLink         = Attributes[IndexOfSrcLabel + 1];
        

                ParsedPage.querySelectorAll("img").forEach(imgel => {
                    AllLinks.push(imgel.attributes.src)
                });
                ImageLinks.push(ImageLink);
        
        
                __Log(`[${redBright(`Gallery ${galleryindex}/${PageLinks.length} ⋅ Page ${page + 1}/${GalleryPages} ⋅ (${Index}/${PageLinks.length})`)} : ${blackBright(PageLink)}] 🔍 Successfully found image link (${ImageLink})`);


                if (Settings.download) {
            
                    if (!fs.existsSync(`./images/${CleanFolderName}`)) {
                        fs.mkdirSync(`./images/${CleanFolderName}`);
                    }

            
                    const ImageURL      = ImageLink;
                    const FileExtension = ImageURL.split(".").at(-1);
        
                    let fails = 0;
                    await write();
        
                    async function write () {
                        try {
                            fs.writeFileSync(`./images/${CleanFolderName}/${(page * 40) + i + 1}.${FileExtension}`, (await $.get(ImageURL, {
                                headers: {
                                    "ipb_pass_hash": "f21571df77a39f2cf2eb4ff1576ff7aa",
                                    "ipb_member_id": "6310538",
                                    "sk": "tfvnmzdrsgyhx3dsv79m27xt084w",
                                    "ipb_session_id": "060dfa7dc34fecf8f996199018dff63c"
                                }
                            })).body);
        
                            console.log(blueBright(`[${(page * 40) + i + 1}] [${CleanFolderName.substring(0, 60)}] 🔽 Downloaded`));
                        } catch (e) {
                            fails++
        
                            if (fails >= 5) {
                                console.log(AllLinks)
                                throw e;
                            } else {
                                console.log("failed, retring " + "attempt " + fails.toString());
                                await write()
                            }
                        }
                    }
                }

                __Log("\n");
            }
        }



        __Log(green(`✅ Successfully fetched all images`));


        const GalleryDataResponse = await $.post("https://api.e-hentai.org/api.php", {
            body: JSON.stringify({
                "method": "gdata",
                "gidlist": [
                    [GalleryID, GalleryToken]
                ],
                "namespace": 1
            })
        });

        const GalleryData = JSON.parse(GalleryDataResponse.body.toString()).gmetadata[0];


        /* @Gallery Data
        {
            "gid": 2231376,
            "token": "a7584a5932",
            "archiver_key": "459562--7e27d313c50099214fde6bf74f8014d9309a2bb8",
            "title": "[Gentsuki] Kininaru Danshi ni 〇〇 suru Onnanoko. [Color Ban] [Ongoing]",
            "title_jpn": "[ゲンツキ] 気になる男子に〇〇する女の子。【カラー版】 [進行中]",
            "category": "Artist CG",
            "thumb": "https://ehgt.org/1f/f5/1ff5e361bbf7eaa235e9560dc5d12e624959e9e7-2722367-1882-3000-jpg_l.jpg",
            "uploader": "Pokom",
            "posted": "1653702810",
            "filecount": "329",
            "filesize": 419547090,
            "expunged": false,
            "rating": "4.78",
            "torrentcount": "2",
            "torrents": [
                {
                    "hash": "25198ccc3cd88393897aa5c630eb95d5ec4f695e",
                    "added": "1634958428",
                    "name": "(同人CG集) [ゲンツキ] 気になる男子に〇〇する女の子。【カラー版】 [進行中].zip",
                    "tsize": "12256",
                    "fsize": "310511523"
                },
                {
                    "hash": "62c960eb1c7a0e00dc2933a0c83dd43e2e6ebd48",
                    "added": "1639495362",
                    "name": "[Artist CG] Gentsuki - Kininaru Danshi ni 〇〇 suru Onnanoko (14 December 2021).zip",
                    "tsize": "27652",
                    "fsize": "357426803"
                }
            ],
            "tags": [
                "artist:gentsuki",
                "female:ponytail",
                "female:schoolgirl uniform",
                "female:stockings",
                "female:swimsuit",
                "female:tanlines",
                "female:twintails",
                "other:no penetration",
                "other:nudity only"
            ],
            "parent_gid": "2197090",
            "parent_key": "2f440c5f01",
            "first_gid": "2043548",
            "first_key": "bdb0cd9ec2"
        }
        */

        ImagesData.push({
            gallery     : GalleryData,
            imageURLs   : ImageLinks,
            AllLinks
        });
    }



    return ImagesData;



    function __Log (string, variables) {

        const ParsedString = string
            .replace(/\$[a-zA-Z0-9 _-]+\$/g, VariableName => {
               
                if (VariableName in variables) {
                
                    return variables[VariableName]
               
                } else 
                
                return VariableName

            });
    
    
        return ParsedString;
    }

    function AddCounter(ID) {
        Counters.set(ID, Counters.get(ID) + 1);
    };
    
    function ResetCounter(ID) {
        Counters.set(ID, 0);
    };

    function NewCounter (startfrom) {
        const ID = Date.now();

        Counters.set(ID, (startfrom || 0));

        return ID;
    }

    function Count (ID) {
        return Counters.get(ID);
    }

    function CounterStartFrom (ID, val) {
        Counters.set(ID, val);
    }
}