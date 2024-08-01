let initialVolume = 0.5
let fadeDownVolume = 0.04
let rememberPlayVol
let basichowl
let soundId
let playlist = []
let currentTrackIndex = 0
let currentPlaylistPath = ''
let loadedPlaylists = {}

async function fetchJSON(url) {
    const response = await fetch(url)
    return response.json()
}

// Function to load the playlists from a JSON file
async function loadPlaylists() {
    try {
        const responseJSON = await fetchJSON('./slideshow/playlists.json')
        if (responseJSON) {
            loadedPlaylists = responseJSON
        }
    } catch (error) {
        console.error('Error loading playlists:', error)
    }
}

function setupHowlerAudio(src) {
    playlist = src; // Set the playlist array
    currentTrackIndex = 0; // Start at the first track
    currentPlaylistPath = src.join(','); // Unique identifier for the playlist

    // Create the Howl object
    basichowl = new Howl({
        src: [playlist[currentTrackIndex]],
        volume: initialVolume,
        html5: true,
        onend: function () {
            nextTrack(); // Automatically play next track when current one ends
        }
    })

    eventHandlers()
}

function eventHandlers() {
    // Handle the 'click' events
    document.getElementById('playbasichowl').addEventListener('click', play)
    document.getElementById('pausebasichowl').addEventListener('click', pause)
    document.getElementById('stopbasichowl').addEventListener('click', stop)
    document.getElementById('fadedownbasichowl').addEventListener('click', fadeDown)
    document.getElementById('fadeupbasichowl').addEventListener('click', fadeUp)
    document.getElementById('nextbasichowl').addEventListener('click', nextTrack)
    document.getElementById('prevbasichowl').addEventListener('click',prevTrack)
    document.getElementById('playrandombasichowl').addEventListener('click', playRandom)

    // Handle range slider input events
    document.getElementById('volume').addEventListener('input', (e) => { adjustVolume(e.target.value) })

    // Create the Howl object
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
    })

    // Handle the 'click' event
    document.getElementById('playeffect01').addEventListener('click', () => {
        spritehowl.play('effect1')
    })

    document.getElementById('playeffect02').addEventListener('click', () => {
        spritehowl.play('effect2')
    })

    document.getElementById('playeffect03').addEventListener('click', () => {
        spritehowl.play('effect3')
    })

    document.getElementById('playeffect04').addEventListener('click', () => {
        spritehowl.play('effect4')
    })

    document.getElementById('playeffect05').addEventListener('click', () => {
        spritehowl.play('effect5')
    })
}

async function play() {
    if (basichowl.playing(soundId)) return
    document.body.classList.add('music-playing')
    console.log(`Audio playing: ${basichowl._src}`)
    alert(`Audio playing: ${basichowl._src}`)
    soundId = basichowl.play()
    basichowl.fade(0, initialVolume, 1000); // Fade in
}

async function pause() {
    basichowl.fade(basichowl.volume(), 0, 1000); // Fade out
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause after fade out
}

async function stop() {
    document.body.classList.remove('music-playing')
    basichowl.fade(basichowl.volume(), 0, 1000); // Fade out
    await new Promise(resolve => setTimeout(resolve, 1000)); // Stop after fade out
    basichowl.stop()
}

async function fadeDown() {
    rememberPlayVol = basichowl.volume()
    let fadeDownVol = Math.min(rememberPlayVol / 2, fadeDownVolume)
    basichowl.fade(rememberPlayVol, fadeDownVol, 1000); // Fade down
}

async function fadeUp() {
    basichowl.fade(basichowl.volume(), rememberPlayVol, 1000); // Fade back in
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length
    changeTrack()
}

function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length
    changeTrack()
}

function adjustVolume(val) {
    basichowl.volume(val)
}

function changeTrack() {
    document.body.classList.remove('music-playing')
    basichowl.stop()
    basichowl = new Howl({
        src: [playlist[currentTrackIndex]],
        volume: initialVolume,
        onend: function () {
            nextTrack(); // Automatically play next track when current one ends
        }
    })
    console.log(`Audio playing: ${basichowl._src}`)
    alert(`Audio playing: ${basichowl._src}`)
    soundId = basichowl.play()
    document.body.classList.add('music-playing')
}

// Function to update the playlist based on the trigger
async function updatePlaylist(newPlaylistIdOrArray) {
    let newPlaylist;
    
    if (Array.isArray(newPlaylistIdOrArray)) {
        newPlaylist = newPlaylistIdOrArray;
    } else {
        newPlaylist = loadedPlaylists[newPlaylistIdOrArray];
    }

    if (!newPlaylist) {
        console.error('Playlist not found:', newPlaylistIdOrArray);
        return;
    }

    const newPlaylistPath = Array.isArray(newPlaylistIdOrArray) ? newPlaylistIdOrArray.join(',') : newPlaylistIdOrArray;

    if (currentPlaylistPath === newPlaylistPath) {
        // Same playlist, continue playing
        return;
    }

    if (!newPlaylistPath) {
        // No playlist assigned to the next slide, fade out the current playlist
        document.body.classList.remove('music-playing');
        basichowl.fade(basichowl.volume(), 0, 1000);
        await new Promise(resolve => setTimeout(resolve, 1000));
        basichowl.stop();
        currentPlaylistPath = '';
        return;
    }

    // Stop the current playlist
    document.body.classList.remove('music-playing');
    basichowl.fade(basichowl.volume(), 0, 1000);
    await new Promise(resolve => setTimeout(resolve, 1000));
    basichowl.stop();
    await setupHowlerAudio(newPlaylist);
    currentPlaylistPath = newPlaylistPath;
}

// Function to play a random track from the current playlist
async function playRandom() {
    currentTrackIndex = Math.floor(Math.random() * playlist.length)
    await changeTrack()
}

// Function to check if something is playing
function isPlaying() {
    return basichowl.playing()
}

// Function to toggle play/pause
async function togglePlayStop() {
    if (isPlaying()) {
        await stop()
    } else {
        await playRandom()
    }
}

// Export the necessary functions
export { setupHowlerAudio, updatePlaylist, loadPlaylists, play, pause, stop, fadeDown, fadeUp, nextTrack, prevTrack, playRandom, isPlaying, togglePlayStop }
