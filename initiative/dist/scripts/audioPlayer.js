let initialVolume = 0.5;
let fadeDownVolume = 0.04;
let rememberPlayVol;
let basichowl;
let soundId;
let playlist = [];
let currentTrackIndex = 0;

export function setupHowlerAudio(src) {
    playlist = src; // Set the playlist array
    currentTrackIndex = 0; // Start at the first track

    //Create the Howl object
    basichowl = new Howl({
        src: [playlist[currentTrackIndex]],
        volume: initialVolume,
        onend: function() {
            nextTrack(); // Automatically play next track when current one ends
        }
    });

    //Handle the 'click' events
    document.getElementById('playbasichowl').addEventListener('click', () => {
        if (basichowl.playing(soundId)) return;
        soundId = basichowl.play();
        basichowl.fade(0, initialVolume, 1000); // Fade in
    });

    document.getElementById('pausebasichowl').addEventListener('click', () => {
        basichowl.fade(basichowl.volume(), 0, 1000); // Fade out
        setTimeout(() => basichowl.pause(), 1000); // Pause after fade out
    });

    document.getElementById('stopbasichowl').addEventListener('click', () => {
        basichowl.fade(basichowl.volume(), 0, 1000); // Fade out
        setTimeout(() => basichowl.stop(), 1000); // Stop after fade out
        //Note that Howler gives us a stop() method that returns the audio to 0.
    });

    document.getElementById('fadedownbasichowl').addEventListener('click', () => {
        rememberPlayVol = basichowl.volume();
        let fadeDownVol = Math.min(rememberPlayVol / 2, fadeDownVolume);
        basichowl.fade(rememberPlayVol, fadeDownVol, 1000); // Fade down
    });

    document.getElementById('fadeupbasichowl').addEventListener('click', () => {
        basichowl.fade(basichowl.volume(), rememberPlayVol, 1000); // Fade back in
    });

    document.getElementById('nextbasichowl').addEventListener('click', () => {
        nextTrack();
    });

    document.getElementById('prevbasichowl').addEventListener('click', () => {
        prevTrack();
    });

    //Handle range slider input events
    document.getElementById('volume').addEventListener('input', (e) => {
        basichowl.volume(e.target.value);
    });

    //Create the Howl object
    var spritehowl = new Howl({
        src: ['http://www.erikscull.com/n520/2017/escull/media/audiospritedemo.mp3'],
        sprite: {
            //label: [starttime, duration]
            effect1: [0, 500],
            effect2: [1000, 1500],
            effect3: [3000, 500],
            effect4: [4000, 1000],
            effect5: [5000, 1000]
        }
    });

    //Handle the 'click' event
    document.getElementById('playeffect01').addEventListener('click', () => {
        spritehowl.play('effect1');
    });

    document.getElementById('playeffect02').addEventListener('click', () => {
        spritehowl.play('effect2');
    });

    document.getElementById('playeffect03').addEventListener('click', () => {
        spritehowl.play('effect3');
    });

    document.getElementById('playeffect04').addEventListener('click', () => {
        spritehowl.play('effect4');
    });

    document.getElementById('playeffect05').addEventListener('click', () => {
        spritehowl.play('effect5');
    });
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    changeTrack();
}

function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    changeTrack();
}

function changeTrack() {
    basichowl.stop();
    basichowl = new Howl({
        src: [playlist[currentTrackIndex]],
        volume: initialVolume,
        onend: function() {
            nextTrack(); // Automatically play next track when current one ends
        }
    });
    soundId = basichowl.play();
}
