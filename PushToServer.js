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


async function Main () 
{
    let WriteData = oldFiles;
    const ImageDatasRequiredToFetch = fs.readdirSync("./images").filter(gid => gid in WriteData === false);

    for (const GalleryId of ImageDatasRequiredToFetch) {
        const current = magenta(ImageDatasRequiredToFetch.indexOf(GalleryId) + 1);

        console.log(`[${current}/${ImageDatasRequiredToFetch.length}] Fetching data for ${yellowBright(GalleryId)}`);



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
        const country  = Array.from(document.querySelector(".g_flag").classList).find(c => (c !== "g_flag") && (c !== "flag_in_gallery"));



        WriteData[GalleryId] = { title, tags, pages, category, country };
    }


    fs.writeFileSync("./ImageData.json", JSON.stringify(WriteData, null, 2));

    const NewlyAddedImages = ImageDatasRequiredToFetch;

    console.log(`==> Fetched data for ${yellowBright(NewlyAddedImages.length)} galleries`)
    console.log(`==> ${yellowBright(NewlyAddedImages.length)} newly added galleries`)



    const UnstagedFiles = cp.execSync("git ls-files -m").toString().trim().split("\n");

    const UnstagedImageFiles = UnstagedFiles.filter(file => file.trim().startsWith("images/"));
    const UnstagedOtherFiles = UnstagedFiles.filter(file => !file.trim().startsWith("images/"));



    const commit_msg = `"added ${NewlyAddedImages.length} galleries"`;


    // const all_dirs_to_push = grp_dirs();
    // let current_dir = 0;

    if (UnstagedOtherFiles[0]) {
        console.log("Pushing unstaged other files ....")
        add_commit_push(UnstagedOtherFiles);
        console.log("Successfully pushed unstaged other files")
    }

    return

    let i = 0;
    const TP = split_arr_by(UnstagedImageFiles, 100);
    for (const dir of TP) {
        i++;

        console.log(`[${i} / ${TP.length}] Starting ... ${dir.length} files ...`);
        add_commit_push(dir);
    }

    // for (const dirs of all_dirs_to_push) {
    //     try {
    //         const dirs_to_push = dirs;

    //         let TimeStart = Date.now();
    //         cp.execSync(`git add ${dirs_to_push.map(d => `"${d}"`).join(" ")}`, {stdio: 'inherit'});
            
    
    
    //         console.log(`[${green("Git Add")}] ${yellowBright(pms(Date.now() - TimeStart, { verbose: true }))}`)
    
    //         cp.execSync(`git commit -m ${commit_msg}`, {stdio: 'inherit'});
    
    //         console.log(`[${yellowBright("Git Commit")}] ${yellowBright(pms(Date.now() - TimeStart, { verbose: true }))}`)
    
    //         cp.execSync(`git push -u origin main`, {stdio: 'inherit'});
    
    //         console.log(`[${red("Git Push")}] ${yellowBright(pms(Date.now() - TimeStart, { verbose: true }))}`)
    //         console.log(`[Status] ${yellowBright(current_dir + 1)}/${dirs_to_push.length} Pushed`);
    //         console.log(TimeEstimate());
    
    //         current_dir++;
    
    //         function TimeEstimate () {
    //             return `[Status] ${green(pms((dirs_to_push.length - current_dir) * (Date.now() - TimeStart)))} left until finished`
    //         }
    //     } catch (e) {
    //         console.log(e);
    //         continue;
    //     }
    // }

    console.log(cli.green("Pushed All Files."));

    function add_commit_push (dirs) {
            const dirs_to_push = dirs;

            let TimeStart = Date.now();

            cp.execSync(`git add ${dirs_to_push.map(d => `${d.startsWith('"') ? "" : '"'}${d}${d.endsWith('"') ? "" : '"'}`).join(" ")}`, {stdio: 'inherit'});
    
            console.log(`[${green("Git Add")}] ${yellowBright(pms(Date.now() - TimeStart, { verbose: true }))}`)
    
            cp.execSync(`git commit -m ${commit_msg}`, {stdio: 'inherit'});
    
            console.log(`[${yellowBright("Git Commit")}] ${yellowBright(pms(Date.now() - TimeStart, { verbose: true }))}`)
    
            cp.execSync(`git push -u origin main`, {stdio: 'inherit'});
    
            console.log(`[${red("Git Push")}] ${yellowBright(pms(Date.now() - TimeStart, { verbose: true }))}`)
            console.log(`[Status] ${yellowBright(current_dir + 1)}/${dirs_to_push.length} Pushed`);

            current_dir++;
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
            }

            i++;
        }

        return dirs;
    }

    function grp_dirs () {
        let cache   = [];
        let left    = 2000;
        
        const dirs = [];

        let i = 0;
        for (const dir of fs.readdirSync("./images")) {
            const images = fs.readdirSync(`./images/${dir}`);

            cache.push(`./images/${dir}`);
            left -= images.length;

            if (left <= 0 || i === (fs.readdirSync("./images").length - 1)) {
                dirs.push(cache);
                cache = [];
            }

            i++;
        }

        return dirs;
    }
}


Main().then();