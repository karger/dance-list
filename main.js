
(async function () {
    await Mavo.ready;

    Mavo.DOMExpression.special.event("$user", {
        type: "mv-login mv-logout",
        update: (evt) => {
            return (evt.type == "mv-login") ? evt.backend.user : null;
        }
    });
})();


//must run before loading spotify api
let spotifyPromise = new Promise(resolve => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
        console.log('Spotify IFrame API ready');
        const element = document.getElementById('spotify-embed');
        const options = {
            width: getComputedStyle(element).getPropertyValue("--player-width")
            , height: getComputedStyle(element).getPropertyValue("--player-height")
            , uri: 'spotify:track:4QNDlhoal2QdrEObKrxn7j'
        };

        if (!element) {
            console.warn('No #spotify-embed element found');
            return;
        }

        IFrameAPI.createController(element, options, (controller) => {
            console.log('Spotify Controller created');
            function play(id) {
                controller.loadUri('spotify:track:' + id);
                controller.play();
            }

            controller.once('ready', () => {
                console.log('Spotify Controller Ready');
                resolve({
                    play: play,
                    stop: controller.pause.bind(controller),
                });
            });
        });
    };
});


//must run before loading youtube api
let youtubePromise = new Promise(resolve => {
    window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API ready');

        const el = document.getElementById('youtube-embed');
        if (!el) {
            console.warn('No #youtube-embed element found');
            return;
        }

        const cs = getComputedStyle(el);
        const height = parseInt(cs.getPropertyValue("--player-height"), 10) || 500;
        const width = parseInt(cs.getPropertyValue("--player-width"), 10) || 560;

        const yt = new YT.Player('youtube-embed', {
            height, width,
            videoId: 'M7lc1UVf-VE',
            playerVars: {
                playsinline: 1,
                autoplay: 0,
                controls: 1,
                origin: window.location.origin
            },
            events: {
                onReady: (event) => {
                    const player = event.target;
                    console.log('YouTube Player Ready');
                    document.documentElement.style.setProperty('--youtube-display', 'none');
                    resolve({
                        play: (id) => player.loadVideoById(id),
                        stop: player.pauseVideo.bind(player)
                    });
                },
                onError: (event) => {
                    console.warn('YT error', event.data);
                    resolve({
                        play: (id) => window.open(yt.getVideoUrl()),
                        stop: () => { }
                    });
                }
            }
        });
    };
});

let apis = [spotifyPromise, youtubePromise];

let players = [
    {
        embed: 'spotify',
        regex: /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(?:\?.*)?/,
        api: spotifyPromise
    },
    {
        embed: 'youtube',
        regex: /https:\/\/www\.youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/,
        api: youtubePromise
    },
    {
        embed: 'youtube',
        regex: /https:\/\/www\.youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
        api: youtubePromise
    },
    {
        embed: 'youtube',
        regex: /https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/,
        api: youtubePromise
    }
];

window.findHost = (url) => players.find(player => player.regex.test(url))?.embed || 'none';

window.playURL = async function (url) {
    url = url.toJSON();
    for (api of apis) {
        (await api).stop();
    };
    for (player of players) {
        if (id = url.match(player.regex)?.[1]) {
            try {
                console.log(`Playing ${url} on ${player.embed} as ${id}`);
                (await player.api).play(id);
            } catch {
                window.open(url);
            }
            return;
        }
    };
    //no player found, open in new tab
    window.open(url);
}
