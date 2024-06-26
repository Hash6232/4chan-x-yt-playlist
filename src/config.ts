declare global {
    interface Window {
        thread_archived: boolean,

        Main: {
            stylesheet: string
        },
    
        Config: { 
            disableAll: boolean,
            dropDownNav: boolean,
            classicNav: boolean,
            autoHideNav: boolean
         },
         
        onYouTubeIframeAPIReady: () => void;
    }
}

const C = new class Conf {

    constructor() {

        const pathname = location.pathname.slice(1).split("/thread/");
        this.board = pathname[0];
        this.thread = pathname[1];

        if (this.warosu) this.initFinished = true;

        document.addEventListener("4chanMainInit", () => {
            this.native = !unsafeWindow.Config.disableAll;
            this.fixedNav = unsafeWindow.Config.dropDownNav;
            this.classicNav = unsafeWindow.Config.classicNav;
            this.autohideNav = unsafeWindow.Config.autoHideNav;
            this.initFinished = true;
        });

        document.addEventListener("4chanXInitFinished", () => {
            this.fourchanX = true;
        });

    }

    initFinished = false;

    fourchan = location.hostname === "boards.4chan.org";
    warosu = location.hostname === "warosu.org";
    board: string;
    thread: string;

    // 4chan Native
    native = true;
    fixedNav = false;
    classicNav = false;
    autohideNav = false;
    
    // 4chan X
    fourchanX = false;
    get fixedHeader() {
        if (!this.fourchanX) return false;
        return document.documentElement.classList.contains("fixed")
    }
    get autohideHeader() {
        if (!this.fourchanX) return false;
        return document.documentElement.classList.contains("autohide")
    }

}

export { C }