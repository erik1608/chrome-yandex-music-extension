(function() {
    externalAPI.on(externalAPI.EVENT_CONTROLS, function() {
        // Event fired when the player controls are ready.
        updateMediaControls();
    })

    externalAPI.on(externalAPI.EVENT_TRACK, function() {
        // Event fired when the track is ready.
        updateSessionMetadata();
    })

    function updateSessionMetadata() {
        let currentTrackDetails = externalAPI.getCurrentTrack();
        let trackTitle = currentTrackDetails.title;
        if (currentTrackDetails.version) {
            trackTitle = trackTitle + ' ( ' + currentTrackDetails.version + ' ) '
        }

        let artists = currentTrackDetails.artists.map(artist => artist.title).join(', ');
   
        navigator.mediaSession.metadata = new MediaMetadata({
            title: trackTitle,
            artist: artists,
            album: !currentTrackDetails.album ? '' : currentTrackDetails.album.title,
            artwork: [
                { src: `https://${currentTrackDetails.cover.replace("%%", "100x100")}`, sizes: '96x96',   type: 'image/png' },
                { src: `https://${currentTrackDetails.cover.replace("%%", "100x100")}`, sizes: '128x128', type: 'image/png' },
                { src: `https://${currentTrackDetails.cover.replace("%%", "200x200")}`, sizes: '192x192', type: 'image/png' },
                { src: `https://${currentTrackDetails.cover.replace("%%", "300x300")}`, sizes: '256x256', type: 'image/png' },
                { src: `https://${currentTrackDetails.cover.replace("%%", "400x400")}`, sizes: '384x384', type: 'image/png' },
                { src: `https://${currentTrackDetails.cover.replace("%%", "400x400")}`, sizes: '512x512', type: 'image/png' },
            ]
        });
    }

    /**
     * Updates the native media session controls. E.g. next, play/pause, previous buttons
     */
    function updateMediaControls() {
        let controls = externalAPI.getControls();
        let nextHandler, prevHandler = null;
        if (controls.next) {
            nextHandler = function () {
                externalAPI.next();
            };
        }

        if (controls.prev) {
            prevHandler = function () {
                externalAPI.prev();
            };
        }

        navigator.mediaSession.setActionHandler('nexttrack', nextHandler);
        navigator.mediaSession.setActionHandler('previoustrack', prevHandler);
        navigator.mediaSession.setActionHandler('play', function() {  
            externalAPI.togglePause();
        });
        navigator.mediaSession.setActionHandler('pause', function() {  
            externalAPI.togglePause();
        });
        navigator.mediaSession.setActionHandler('stop', function() { 
            externalAPI.togglePause();
        });
    }
})();