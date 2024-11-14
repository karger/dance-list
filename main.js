
(async function () {
    await Mavo.ready;

    Mavo.DOMExpression.special.event("$user", {
        type: "mv-login mv-logout",
        update: (evt) => {
            return (evt.type == "mv-login") ? evt.backend.user : null;
        }
    });
})();

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const element = document.getElementById('spotify-embed');
    const options = {
        width: 340
        , height: 90
        , uri: 'spotify:track:4QNDlhoal2QdrEObKrxn7j'
    };
    const callback = (EmbedController) => {
        window.playSpotifyURL = (url) => {
            EmbedController.loadUri(spotifyURI(url));
            EmbedController.play();
        };
    };
    IFrameAPI.createController(element, options, callback);
};

function spotifyURI(url) {
    // Remove everything after the '?' symbol including the '?'
    let cleanedUrl = url.split('?')[0];
    // Remove everything from the beginning up to and including 'track/'
    cleanedUrl = cleanedUrl.split('track/')[1];
    return 'spotify:track:' + cleanedUrl;
}


function youtubeEmbedURL(url) {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
}


