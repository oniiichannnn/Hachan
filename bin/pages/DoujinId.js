const Results       = [];
let Page            = 0;
let IsEndlessView   = false;
let MaxPages        = 0;
let imageURLs       = [];
let CurrentViewing;


async function Main () {
    const Socket = await connectToServer();

    Socket.send(document.URL.split("/")[document.URL.split("/").length - 1])

    Socket.onmessage = (message) => {
        const Result = JSON.parse(message.data);

        if (Result.type === "LOG") {
            const LogMessage = document.createElement("h1");

            LogMessage.innerHTML = Result.message
                .replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g, link => {
                    return `<a href="${link}" class="link">Link</a>`
                });
            LogMessage.classList.add("log-message");
            
            document.body.appendChild(LogMessage);
            document.getElementById("log-history").appendChild(LogMessage);

            return;
        }


        document.getElementById("log-history").remove();


        console.log(Result);

        Result.result.forEach(CreateDoujinElement);

        Results.push(...Result.result);


        for (const element of Array.from(document.getElementsByClassName("read-btn"))) {
            element.onclick = (event) => {
                Display(event.target.id);
            };
        }



        function CreateDoujinElement (result) {
            const Gallery       = result.gallery;


            const Container = document.createElement("div");

            Container.id = Gallery.gid;
            Container.classList.add("doujin");


            const Container_Up      = document.createElement("div");
            const Container_Down    = document.createElement("div");

            Container_Up.id     = "top";
            Container_Down.id   = "bot";


            const img = document.createElement("img");

            img.classList.add("thumbnail");
            img.src = Gallery.thumb;


            const title = document.createElement("h1");

            title.classList.add("title");
            title.innerHTML = Gallery.title;



            const TagContainer = document.createElement("div");

            TagContainer.classList.add("tag-container");


            // ## Making tags
            Gallery.tags.forEach(tag => {
                const Tag = document.createElement("h2");

                Tag.classList.add("tag")
                Tag.innerHTML = tag.split(":")[1];

                document.body.appendChild(Tag);
                TagContainer.appendChild(Tag);
            });




            const ReadButton = document.createElement("div");

            ReadButton.innerHTML = "Read";
            ReadButton.id = Gallery.gid;
            ReadButton.classList.add("read-btn");

            
            document.body.appendChild(Container);
            document.body.appendChild(Container_Up);
            document.body.appendChild(Container_Down);
            
            document.body.appendChild(ReadButton);
            document.body.appendChild(img);
            document.body.appendChild(title);
            document.body.appendChild(TagContainer);


            Container.appendChild(Container_Up);
            Container.appendChild(Container_Down);

            Container_Up.appendChild(img);


            Container_Down.appendChild(title);
            Container_Down.appendChild(TagContainer);
            Container_Down.appendChild(ReadButton);


            document.getElementById("results").appendChild(Container);
        }
    }

    /**
     * @returns {WebSocket}
    */
    async function connectToServer() {
        const ws = new WebSocket("ws://localhost:5000/doujin/$DOUJIN_ID$");
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                if(ws.readyState === 1) {
                    clearInterval(timer)
                    resolve(ws);
                }
            }, 10);
        });
    }
}

Main().then();

function Close () {
    Page = 0;

    document.getElementById("view-bg").style.display = "none";

    document.querySelector("#query-display").style.display = "block";
    document.querySelector("#results").style.display = "block";
}

function EndlessView () {
    IsEndlessView = !IsEndlessView

    if (IsEndlessView) {
        document.getElementById("endless-view").classList.add("on");
        document.getElementById("endless-view").classList.remove("off");


        document.querySelector(".current-display").classList.remove("current-display");
        document.querySelector("#view-bg #bot.default").classList.add("endless");
        document.querySelector("#view-bg #bot.default").classList.remove("default");

        document.querySelector("#view-bg #bot #left").classList.add("hide");
        document.querySelector("#view-bg #bot #right").classList.add("hide");



        Array.from(document.getElementsByClassName("display")).forEach(element => {
            element.classList.add("endless-display");
        });
    } else {
        document.getElementById("endless-view").classList.add("off");
        document.getElementById("endless-view").classList.remove("on");

        document.querySelector("#view-bg #bot.endless").classList.add("default");
        document.querySelector("#view-bg #bot.endless").classList.remove("endless");

        document.querySelector("#view-bg #bot #left").classList.remove("hide");
        document.querySelector("#view-bg #bot #right").classList.remove("hide");

        Array.from(document.getElementsByClassName("display")).forEach((element, index) => {
            if (index === Page) {
                element.classList.add("current-display");
            }

            element.classList.remove("endless-display");
        });
    }
}

function Next (SkipToMax) {
    if (IsEndlessView) return;

    Page = SkipToMax ? MaxPages : Math.min(MaxPages, Page + 1);

    RefreshImage();
}

function Previous (SkipToMin) {
    if (IsEndlessView) return;

    Page = SkipToMin ? 0 : Math.max(0, Page - 1);

    RefreshImage();
}

function RefreshImage () {
    document.getElementById("page-display").innerHTML = `${Page + 1} / ${MaxPages + 1}`;
    document.querySelector("#view-bg #bot img.current-display").classList.remove("current-display");
    document.querySelector(`#view-bg #bot img#image_${Page}`).classList.add("current-display");
}

function Display (GalleryId) {
    const { imageURLs:imageLinks } = Results.find(res => res.gallery.gid === Number(GalleryId));

    document.getElementById("view-bg").style.display = "block";

    document.querySelector("#query-display").style.display = "none";
    document.querySelector("#results").style.display = "none";

    document.getElementById("page-display").innerHTML = `${Page + 1} / ${imageLinks.length}`;


    if (MaxPages && (CurrentViewing === GalleryId)) {
        RefreshImage()
    } else {
        if (MaxPages) {
            Array.from(document.getElementsByClassName("display")).forEach(element => element.remove());
        }

        imageLinks.forEach((ImageLink, index) => {
            const img = document.createElement("img");
    
            img.id = `image_${index}`;
            img.classList.add("display")
            img.src = ImageLink
            img.onerror = function () {
                this.onerror = null;
                this.src = 'https://imgur.com/Ut0bZHL.png';
            }
    
            if (Page === index) {
                img.classList.add("current-display")
            }
    
            document.body.appendChild(img);
            document.querySelector("#view-bg #bot").appendChild(img);
        });

        CurrentViewing = GalleryId;
    }


    MaxPages = imageLinks.length - 1;
}