import { C } from "./config";
import { Playlist } from "./playlist";

const playlist = new Playlist();

unsafeWindow.onYouTubeIframeAPIReady = () => {

    playlist.player = new YT.Player("playlist", {
        width: '512', height: '288',
        playerVars: { 'fs': 0, 'disablekb': 1, 'rel': 0 },
        events: {
            "onReady": initPlaylist,
            "onStateChange": updateTrack,
            "onError": playbackError
        }
    });

    function initPlaylist(e: YT.PlayerEvent) {

        playlist.state = 0;
    
        const pages = playlist.toPages();
        playlist.dialog.updateTabs(pages.length);

        let history: { [key: string]: string } = {};
        try {
            history = JSON.parse(localStorage.getItem("4chan-yt-playlist-history") || "{}");
        } catch (err) { console.error("Failed to parse playlist history from local storage"); console.error(err); };
        
        const lastPlayedTrack = history[C.board + "." + C.thread] || null;
        const lastPage = lastPlayedTrack ? pages.find(p => p.includes(lastPlayedTrack)) : null;
    
        if (lastPlayedTrack && lastPage) {
            e.target.cuePlaylist(lastPage, lastPage.indexOf(lastPlayedTrack))
        } else {
            e.target.cuePlaylist(pages[0])
        }

        playlist.dialog.toggle();

    };
    
    function updateTrack(e: YT.OnStateChangeEvent) {
    
        if (e.data == 0) { // If playlist ended
            
            const pages = playlist.toPages();
            const page = pages.findIndex(p => p.includes(playlist.track));
    
            if (page > -1 && page < pages.length - 1) e.target.loadPlaylist(pages[page + 1]);

        } else if (e.data == -1) { // If track ended or next is loaded

            // Save last played track
            playlist.track = e.target.getVideoUrl().split("=").pop() || "";
            
            let history: { [key: string]: string } = {};
            try {
                history = JSON.parse(localStorage.getItem("4chan-yt-playlist-history") || "{}");
            } catch (err) { console.error("Failed to parse playlist history from local storage."); console.error(err); };
            
            history[C.board + "." + C.thread] = playlist.track;
            localStorage.setItem("4chan-yt-playlist-history", JSON.stringify(history));
    
            // Due to a change to when state 0 is returned, update playlist
            // attempts must now also happen when the next track is loaded
            if (playlist.mutated) playlist.updatePlayer();

            // Reset spinning animation when using manual reload button
            const icon = playlist.dialog.self?.querySelector(".reload .icon");
            icon?.classList.remove("spin");

            // Move focus away from iframe to hide ghosting "Next track" popup
            playlist.player?.getIframe().blur();

        }
    
        // This has to stay at the bottom or it will mess with prev isPlaying checks
        playlist.playing = (e.data == 1 || e.data == 3) ? true : false;
    
    };
    
    function playbackError(e: YT.OnErrorEvent) {
    
        let errLvl = "", errMsg = "";
    
        const index = e.target.getPlaylistIndex();
        const length = e.target.getPlaylist().length;
    
        switch(+e.data) {

            case 5:
            case 100:
            case 101:
            case 150:
                if (index + 1 < length) { e.target.nextVideo() };
                
            case 101:
            case 150:
                errLvl = "warning";
                errMsg = "The owner of the requested video does not allow it to be played in embedded players.";
                break;

            case 2:
                errLvl = "error";
                errMsg = "The request contains an invalid parameter value.";
                break;

            case 5:
                errLvl = "error";
                errMsg = "The requested content cannot be played in an HTML5 player.";
                break;

            case 100:
                errLvl = "warning";
                errMsg = "The video has been removed or marked as private.";
                break;

        };
    
        const output = "Error - Video #" + (index + 1) + "\n" + errMsg;

        if (C.fourchanX) {
            document.dispatchEvent(new CustomEvent("CreateNotification", {
                detail: { type: errLvl, content: output, lifetime: 10 }
            }));
        } else {
            switch(errLvl) {
                case "error":
                    console.error(output);
                    break;

                case "warning":
                    console.warn(output);
                    break;

                default:
                    console.info(output);
                    break;
            }
        }

    };

};

document.addEventListener("DOMContentLoaded", () => {

    if (C.fourchan) document.documentElement.classList.add("fourchan");
    if (C.warosu) document.documentElement.classList.add("warosu");

    let css = ":root.yotsuba{--fourchan-native-background-color:#f0e0d6;--fourchan-native-border-color:#d9bfb7}:root.yotsuba-b{--fourchan-native-background-color:#d6daf0;--fourchan-native-border-color:#b7c5d9}:root.futaba{--fourchan-native-background-color:#f0e0d6;--fourchan-native-border-color:#d9bfb7}:root.burichan{--fourchan-native-background-color:#d6daf0;--fourchan-native-border-color:#b7c5d9}:root.tomorrow{--fourchan-native-background-color:#282a2e;--fourchan-native-border-color:#282a2e}:root.photon{--fourchan-native-background-color:#ddd;--fourchan-native-border-color:#ccc}#playlist-embed{position:fixed;padding:1px 4px}:root:not(.fourchan-x) #playlist-embed{border-width:1px;border-style:solid;box-shadow:0 1px 2px rgba(0,0,0,.15)}:root.fourchan:not(.fourchan-x) #playlist-embed{background-color:var(--fourchan-native-background-color);border-color:var(--fourchan-native-border-color)}:root.warosu #playlist-embed{background-color:var(--darker-background-color);border-color:var(--even-darker-background-color)}:root.warosu #playlist-embed a{text-decoration:none}#playlist-embed.hide{display:none}#playlist-embed>div:first-child{display:flex}#playlist-embed .icon{height:12px}#playlist-embed .icon.spin{transform:rotate(360deg);-webkit-transition:transform .25s ease-in;-moz-transition:transform .25s ease-in;-ms-transition:transform .25s ease-in;-o-transition:transform .25s ease-in;transition:transform .25s ease-in}:root.fourchan #playlist-embed .reload{transform:translate(0,1px)}#playlist-embed .reload{margin-right:.25em}#playlist-embed ul,#playlist-embed li{margin:0;padding:0}#playlist-embed li{display:inline-block;list-style-type:none}#playlist-embed li:only-of-type{display:none}#playlist-embed li:not(:only-of-type):not(:last-of-type)::after{content:'•';margin:0 .25em}#playlist-embed .move{flex:1;cursor:move}#playlist-embed .jump{margin-top:-1px}#playlist-embed .close{margin-left:4px}:root.shortcut-icons:not(.fourchan-xt) #shortcut-playlist .icon--alt-text{font-size:0;visibility:hidden}:root:not(.fourchan-xt) #shortcut-playlist .icon{height:15px;width:16px;margin-bottom:-3px}";

    const styles = [ 
        ["yotsuba", "yotsubanew"], ["yotsuba-b", "yotsubabnew"], ["futaba", "futabanew"],
        ["burichan", "burichannew"], ["photon", "photon"], ["tomorrow", "tomorrow"]
    ];

    document.head.insertAdjacentHTML("beforeend", "<style>" + css + "</style>");

    if (! C.fourchan) return;

    changeStylingClass(unsafeWindow.Main.stylesheet.replace(/_/g, ""));

    const ob = new MutationObserver(() => { changeStylingClass() });
    ob.observe((document.querySelector("link[rel='stylesheet']") as HTMLLinkElement), { attributes: true });
    
    function changeStylingClass(cookie?: string) {

        if (C.fourchanX) return;
 
        const currentStyleName = document.styleSheets[0].href?.match(/css\/(.+)\..+\.css$/)?.[1] || "";
        const index = styles.map((s) => s[1]).indexOf(cookie ? cookie : currentStyleName);

        if (index < 0 || document.documentElement.classList.contains(styles[index][0])) return;        
        
        styles.forEach((c) => document.documentElement.classList.remove(c[0]));
        document.documentElement.classList.add(styles[index][0]);

    }

});