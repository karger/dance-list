
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
            width: 340
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
        var player = new YT.Player('youtube-embed', {
            height: getComputedStyle(document.getElementById('youtube-embed')).getPropertyValue("--player-height"),
            width: '340',
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
                })
            }
        });
    }
});

let players = [
    {
        host: 'spotify',
        regex: /https:\/\/open.spotify.com\/track\/([a-zA-Z0-9]*)/,
        api: spotifyPromise
    },
    {
        host: 'youtube',
        regex: /https:\/\/www.youtube.com\/watch\?v=([a-zA-Z0-9]*)/,
        api: youtubePromise
    }
]

window.findHost = (url) => players.find(player => player.regex.test(url))?.host || 'none';

window.playURL = async function (url, host) {
    url = url.toJSON();
    host = host.toJSON();
    players.forEach(async player => {
        (await player.api).stop();
    });
    if (host == 'none') {
        window.open(url);
    } else {
        let player = players.find(player => player.host == host);
        let id = url.match(player.regex)[1];
        (await player.api).play(id);
    }
}
