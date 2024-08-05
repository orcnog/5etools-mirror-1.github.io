/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

import './siriwave.js'
class HowlerPlayer {
    constructor(playlist) {
        // Cache references to DOM elements.
        this.elms = [
            'track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn',
            'playlistBtn', 'volumeBtn', 'progress', 'bar', 'waveform', 'loading',
            'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'
        ]
        this.elms.forEach(function (elm) {
            this[elm] = document.getElementById(elm)
        }, this)

        this.playlist = playlist || []
        this.index = 0
        this.lastVolume = 1 // Initialize to track the last volume before fade

        this.initDOM()
        this.setupPlaylistDisplay()
    }
    
    initDOM() {
        var self = this
        // Bind player controls.
        this.playBtn.addEventListener('click', function () {
            self.play()
        })
        this.pauseBtn.addEventListener('click', function () {
            self.pause()
        })
        this.prevBtn.addEventListener('click', function () {
            self.skip('prev')
        })
        this.nextBtn.addEventListener('click', function () {
            self.skip('next')
        })
        this.waveform.addEventListener('click', function (event) {
            // Get the bounding rectangle of the element
            var rect = self.waveform.getBoundingClientRect()

            // Calculate the click position relative to the element
            var clickPositionX = event.clientX - rect.left

            // Calculate the width of the element
            var elementWidth = rect.width

            // Calculate the percentage position
            var percentage = clickPositionX / elementWidth

            // Log the percentage (0.0 to 1.0)
            console.log(percentage)

            // Update track seek position
            self.seek(percentage)
        })
        this.playlistBtn.addEventListener('click', function () {
            self.togglePlaylist()
        })
        this.volumeBtn.addEventListener('click', function () {
            self.toggleVolume()
        })
        this.volume.addEventListener('click', function () {
            self.toggleVolume()
        })

        // Setup the event listeners to enable dragging of volume slider.
        this.barEmpty.addEventListener('click', function (event) {
            var per = event.layerX / parseFloat(self.barEmpty.scrollWidth)
            self.volume(per)
        })
        this.sliderBtn.addEventListener('mousedown', function () {
            window.sliderDown = true
        })
        this.sliderBtn.addEventListener('touchstart', function () {
            window.sliderDown = true
        })
        this.volume.addEventListener('mouseup', function () {
            window.sliderDown = false
        })
        this.volume.addEventListener('touchend', function () {
            window.sliderDown = false
        })

        var move = function (event) {
            if (window.sliderDown) {
                var x = event.clientX || event.touches[0].clientX
                var startX = window.innerWidth * 0.05
                var layerX = x - startX
                var per = Math.min(1, Math.max(0, layerX / parseFloat(self.barEmpty.scrollWidth)))
                self.volume(per)
            }
        }

        this.volume.addEventListener('mousemove', move)
        this.volume.addEventListener('touchmove', move)

        // Setup the "waveform" animation.
        this.wave = new SiriWave({
            container: this.waveform,
            width: Math.min(window.innerWidth, 540),
            height: 100,
            cover: true,
            speed: 0.03,
            amplitude: 0.7,
            frequency: 2
        })
        this.wave.start()
    }

    setupPlaylistDisplay() {
        var self = this
        if (self.playlist && self.playlist.length > 0) {
            // Display the title of the first track.
            self.track.innerHTML = '1. ' + self.playlist[0].title

            // Setup the playlist display.
            self.playlist.forEach(function (song) {
                var div = document.createElement('div')
                div.className = 'list-song'
                div.innerHTML = song.title
                div.onclick = function () {
                    self.skipTo(playlist.indexOf(song))
                }
                self.list.appendChild(div)
            })
        } else {
            console.warn ('Playlist is empty!')
        }
    }

    play(index) {
        var self = this
        var sound

        index = typeof index === 'number' ? index : self.index
        var data = self.playlist[index]

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl
        } else {
            sound = data.howl = new Howl({
                src: [data.file],
                html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
                onplay: function () {
                    // Display the duration.
                    self.duration.innerHTML = self.formatTime(Math.round(sound.duration()))

                    // Start updating the progress of the track.
                    requestAnimationFrame(self.step.bind(self))

                    // Start the wave animation if we have already loaded
                    self.wave.container.style.display = 'block'
                    self.bar.style.display = 'none'
                    self.pauseBtn.style.display = 'block'

                    if (typeof self.onPlay === 'function') self.onPlay()
                },
                onload: function () {
                    // Start the wave animation.
                    self.wave.container.style.display = 'block'
                    self.bar.style.display = 'none'
                    self.loading.style.display = 'none'
                    
                    if (typeof self.onLoad === 'function') self.onLoad()
                },
                onend: function () {
                    // Stop the wave animation.
                    self.wave.container.style.display = 'none'
                    self.bar.style.display = 'block'
                    self.skip('next')
                    
                    if (typeof self.onEnd === 'function') self.onEnd()
                },
                onpause: function () {
                    // Stop the wave animation.
                    self.wave.container.style.display = 'none'
                    self.bar.style.display = 'block'
                    
                    if (typeof self.onPause === 'function') self.onPause()
                },
                onstop: function () {
                    // Stop the wave animation.
                    self.wave.container.style.display = 'none'
                    self.bar.style.display = 'block'
                    
                    if (typeof self.onStop === 'function') self.onStop()
                },
                onseek: function () {
                    // Start updating the progress of the track.
                    requestAnimationFrame(self.step.bind(self))

                    if (typeof self.onSeek === 'function') self.onSeek()
                }
            })
        }

        if (sound) {
            // Begin playing the sound.
            sound.play()
            console.info(`Playing: ${data.title}`)

            // Update the track display.
            self.track.innerHTML = (index + 1) + '. ' + data.title

            // Show the pause button.
            if (sound.state() === 'loaded') {
                self.playBtn.style.display = 'none'
                self.pauseBtn.style.display = 'block'
            } else {
                self.loading.style.display = 'block'
                self.playBtn.style.display = 'none'
                self.pauseBtn.style.display = 'none'
            }
        }

        // Keep track of the index we are currently playing.
        self.index = index
    }

    pause() {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        // Pause the sound.
        sound.pause()

        // Show the play button.
        self.playBtn.style.display = 'block'
        self.pauseBtn.style.display = 'none'
    }

    stop() {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        if (sound) {
            // Pause the sound.
            sound.stop()
        }

        // Show the play button.
        self.playBtn.style.display = 'block'
        self.pauseBtn.style.display = 'none'
    }

    /**
     * Fade the current track down to a very low volume.
     */
    fadeDown() {
        var self = this
        var sound = self.playlist[self.index].howl

        if (sound) {
            // Store the last volume
            this.lastVolume = Howler.volume()

            // Fade the volume down to 0.01 over 1 second
            sound.fade(this.lastVolume, 0.01, 1000)
        }
    }

    /**
     * Fade the current track back up to the last known volume.
     */
    fadeUp() {
        var self = this
        var sound = self.playlist[self.index].howl

        if (sound) {
            // Fade the volume back to the previous level over 1 second
            sound.fade(0.01, this.lastVolume, 1000)
        }
    }

    /**
     * Play a random track from the playlist.
     */
    playRandom() {
        var self = this
        var randomIndex = Math.floor(Math.random() * self.playlist.length)
        self.skipTo(randomIndex)
    }

    skip(direction) {
        var self = this

        // Get the next track based on the direction of the track.
        var index = 0
        if (direction === 'prev') {
            index = self.index - 1
            if (index < 0) {
                index = self.playlist.length - 1
            }
        } else {
            index = self.index + 1
            if (index >= self.playlist.length) {
                index = 0
            }
        }

        self.skipTo(index)
    }

    skipTo(index) {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        // Stop the current track.
        self.stop()

        // Reset progress.
        self.progress.style.width = '0%'

        // Play the new track.
        self.play(index)
    }

    volume(val) {
        var self = this

        // Update the global volume (affecting all Howls).
        Howler.volume(val)

        // Update the display on the slider.
        var barWidth = (val * 90) / 100
        self.barFull.style.width = (barWidth * 100) + '%'
        self.sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px'
    }

    seek(per) {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist[self.index].howl

        // Convert the percent into a seek position.
        if (sound.playing()) {
            sound.seek(sound.duration() * per)
        }
    }

    step() {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        if (sound) {
            // Determine our current seek position.
            var seek = sound?.seek() || 0
            self.timer.innerHTML = self.formatTime(Math.round(seek))
            self.progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%'

            // If the sound is still playing, continue stepping.
            if (sound.playing()) {
                requestAnimationFrame(self.step.bind(self))
            }
        }
    }

    togglePlaylist() {
        var self = this
        var display = (self.playlist.style.display === 'block') ? 'none' : 'block'

        setTimeout(function () {
            self.playlist.style.display = display
        }, (display === 'block') ? 0 : 500)
        self.playlist.className = (display === 'block') ? 'fadein' : 'fadeout'
    }

    toggleVolume() {
        var self = this
        var display = (self.volume.style.display === 'block') ? 'none' : 'block'

        setTimeout(function () {
            self.volume.style.display = display
        }, (display === 'block') ? 0 : 500)
        self.volume.className = (display === 'block') ? 'fadein' : 'fadeout'
    }

    formatTime(secs) {
        var minutes = Math.floor(secs / 60) || 0
        var seconds = (secs - minutes * 60) || 0

        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
    }

    unload() {
        // Unload all Howl instances in the current playlist.
        this.playlist.forEach(song => {
        if (song.howl) {
            song.howl.unload();
        }
        });

        // Reset the playlist display if needed
        while (this.list.firstChild) {
        this.list.removeChild(this.list.firstChild);
        }
    }

    updatePlaylist(newPlaylist) {
        var self = this
        var sound = self.playlist?.[self.index]?.howl

        // Stop the current track.
        self.stop()

        // Unload the current playlist first
        self.unload();

        // Reset progress.
        self.progress.style.width = '0%'

        // Update to the new playlist
        self.playlist = newPlaylist;
        self.index = 0; // Reset the index

        // Update the playlist display
        self.setupPlaylistDisplay();
    }
}

// Export the HowlerPlayer class as default
export default HowlerPlayer
