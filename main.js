
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
        const element = document.getElementById('spotify-embed');
        const options = {
            width: getComputedStyle(element).getPropertyValue("--player-width")
            , height: getComputedStyle(element).getPropertyValue("--player-height")
            , uri: 'spotify:track:4QNDlhoal2QdrEObKrxn7j'
        };
        IFrameAPI.createController(element, options, embedController => {
            embedController.on('ready', () => {
                console.log('Spotify Player Ready');
                resolve({
                    play: (id) => {
                        embedController.loadUri('spotify:track:' + id);
                        embedController.play();
                    },
                    stop: embedController.pause.bind(embedController)
                });
            });
        });
    };
});

//must run before loading youtube api
let youtubePromise = new Promise(resolve => {
    window.onYouTubeIframeAPIReady = () => {
        let style = getComputedStyle(document.getElementById('youtube-embed')),
            player = new YT.Player('youtube-embed', {
                height: style.getPropertyValue("--player-height"),
                width: style.getPropertyValue("--player-width"),
                videoId: 'M7lc1UVf-VE',
                playerVars: {
                    'playsinline': 1
                },
                events: {
                    'onReady': (event => {
                        let player = event.target;
                        resolve({
                            play: (id) => {
                                player.loadVideoById(id);
                            },
                            stop: player.pauseVideo.bind(player)
                        })
                    }),
                    'onError': (event => {
                        window.open(player.getVideoUrl());
                    })
                }
            });
    }
});

let apis = [spotifyPromise, youtubePromise];

let players = [
    {
        embed: 'spotify',
        regex: /https:\/\/open.spotify.com\/track\/([a-zA-Z0-9]*)/,
        api: spotifyPromise
    },
    {
        embed: 'youtube',
        regex: /https:\/\/www.youtube.com\/watch.*\?v=([a-zA-Z0-9_-]*)/,
        api: youtubePromise
    },
    {
        embed: 'youtube',
        regex: /https:\/\/www.youtube.com\/shorts\/([a-zA-Z0-9_-]*)/,
        api: youtubePromise
    },
    {
        embed: 'youtube',
        regex: /https:\/\/www.youtu.be\/([a-zA-Z0-9_-]*)/,
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
            (await player.api).play(id);
            return;
        }
    };
    //no player found, open in new tab
    window.open(url);
}
