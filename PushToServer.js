const cp        = require("node:child_process")
const readline  = require("readline")
const cli       = require("cli-color")
const fs        = require("fs");
const $         = require("node-superfetch");

const oldFiles = require("./ImageData.json");
const { parse } = require("node-html-parser");
const pms       = require("./pretty-ms/index.js");


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


let ScheduledEnd = false;

async function Main () 
{

    rl.question("", (answer) => {
        if (answer === "end") {
            ScheduledEnd = true;
            console.log(red("Scheduled End"));
        } else

        if (answer === "noend") {
            ScheduledEnd = false;
            console.log(green("Removed Scheduled End"));
        }
    });

    const WriteData = typeof oldFiles === "object" ? 
        oldFiles 
        : 
        {};


    const ImageDatasRequiredToFetch = fs
        .readdirSync("./images")
        .filter(gid => gid in WriteData === false);


    for (const GalleryId of ImageDatasRequiredToFetch) {
        const current = magenta(ImageDatasRequiredToFetch.indexOf(GalleryId) + 1);


        console.log(`[${yellowBright(current)}/${ImageDatasRequiredToFetch.length}] Fetching data for ${yellowBright(GalleryId)}`);


        if (GalleryId.startsWith("!")) {
            // non gallery folder
            const title = GalleryId.slice(1);
            const pages = fs.readdirSync(`./images/${GalleryId}`).length;
            const tags  = [{ other: "non gallery" }];
            const category = "doujinshi";
            const country  = "flag-us";
    
    
    
            WriteData[GalleryId] = { title, tags, pages, category, country };
        } else {
            const request   = await $.get(`https://hentaiera.com/gallery/${GalleryId}/`);
            const body      = request.body.toString();
            const document  = parse(body);
    
    
    
            const title = document.querySelector("div.row.gallery_first h1").innerHTML;
            const pages = fs.readdirSync(`./images/${GalleryId}`).length;
            const tags  = document.querySelectorAll("a.tag")
                .map(el => {
                    const url       = el.attributes.href;
                    const category  = url.split("/")[1];
                    const tag       = url.split("/")[2];
    
                    return { category, tag };
                });
            const category = tags.find(t => t.category === "category").tag;
            const country  = [...document.querySelector(".g_flag").classList.values()].find(c => (c !== "g_flag") && (c !== "flag_in_gallery"));
    
    
    
            WriteData[GalleryId] = { title, tags, pages, category, country };
        }


        console.log(`[${green(current)}/${ImageDatasRequiredToFetch.length}] Fetched data for ${green(GalleryId)}`);


        CheckScheduledEnd();
    }



    fs.writeFileSync("./ImageData.json", JSON.stringify(WriteData, null, 2));

    const NewlyAddedImages = ImageDatasRequiredToFetch;

    console.log(`==> Fetched data for ${yellowBright(NewlyAddedImages.length)} galleries`);
    console.log(`==> ${yellowBright(NewlyAddedImages.length)} newly added galleries`);
    console.log(`==> Preparing to push to GitHub ...`)
    


    const UnstagedFiles = cp.execSync("git ls-files -o -m").toString().trim().split("\n");

    const UnstagedImageFiles = UnstagedFiles.filter(file => file.trim().startsWith("images/"));
    const UnstagedOtherFiles = UnstagedFiles.filter(file => !file.trim().startsWith("images/"));


    console.log(`==> ${yellowBright(UnstagedFiles.length)} files to push (${red(UnstagedImageFiles.length)} images, ${magenta(UnstagedOtherFiles.length)} other)`)


    CheckScheduledEnd();


    const commit_msg = `"added ${NewlyAddedImages.length} galleries"`;


    if (UnstagedOtherFiles[0]) {
        let TimeStart = Date.now();

        console.log(`[${magenta("Other")} ${red(1)} / 1] Starting ...`);

        add_commit_push(UnstagedOtherFiles, 1, 1, "Other");
        
        console.log(`[${magenta("Other")} ${red(1)} / 1] Completed in ${red(pms(Date.now() - TimeStart, { verbose: true }))}`);

        CheckScheduledEnd();
    }


    let   CurrentDir = 0;
    const ImageDirsToPush = split_arr_by(UnstagedImageFiles, 100);
    
    for (const dir of ImageDirsToPush) {
        CurrentDir++;


        let TimeStart = Date.now();

        console.log(`[Image ${red(CurrentDir)} / ${ImageDirsToPush.length}] Starting ...`);

        add_commit_push(dir, CurrentDir, ImageDirsToPush.length, "Image");

        console.log(`[Image ${red(CurrentDir)} / ${ImageDirsToPush.length}] Completed in ${red(pms(Date.now() - TimeStart, { verbose: true }))}`);



        CheckScheduledEnd();
    }


    console.log(cli.green("Pushed All Files"));
    rl.close();



    function CheckScheduledEnd () {
        if (ScheduledEnd) {
            console.log(red("Schduled End"));
            process.kill(process.pid);
        }
    }

    function add_commit_push (dirs, CurrentIndex, Indexes, type) {
            const dirs_to_push  = dirs;
            const label         = `[${type} ${red(CurrentIndex)} / ${Indexes}]`


            cp.execSync(`git add ${dirs_to_push.map(d => `${d.startsWith('"') ? "" : '"'}${d}${d.endsWith('"') ? "" : '"'}`).join(" ")}`, {stdio: 'inherit'});
            console.log(`${label} Status: ${green("Git Add")}`);
            console.log(`${label} Status: ${yellowBright("Git Commit")}`);
            console.log(`${label} Status: ${red("Git Push")}`);
    

            cp.execSync(`git commit -m ${commit_msg}`, {stdio: 'inherit'});
    
            cp.execSync(`git push -u origin main`, {stdio: 'inherit'});

            console.log(`[Status] ${dirs_to_push.length} Pushed`);
    }


    function split_arr_by (arr, by) {
        let cache   = [];
        let left    = by;
        
        const dirs = [];

        let i = 0;
        for (const dir of arr) {
            cache.push(dir);
            left -= 1;

            if (left <= 0 || i === (arr.length - 1)) {
                dirs.push(cache);
                cache = [];
                left = by;
            }

            i++;
        }

        return dirs;
    }
}


Main().then();