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
    constructor({ id, playlist = [], loop = false, html5 = false, globalVolume = 0.4 } = {}) {
        if (!id) {
            console.error('HowlerPlayer must be instantiated with an element ID');
            return;
        }

        this.id = id
        this.playlist = playlist
        this.loop = loop
        this.html5 = html5
        this.globalVolume = globalVolume

        // Cache references to DOM elements.
        this.elms = [
            'track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'shuffleBtn',
            'repeatBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'waveform', 'loading',
            'playlistmenu', 'list', 'volumeOverlay', 'volumeSlider'
        ]
        const wrapper = document.getElementById(this.id)
        this.elms.forEach(function (elm) {
            const element = wrapper.querySelector(`.${elm}`)
            this[elm] = element
        }, this)

        this.index = 0
        this.fadeUpReturnToVolume = 0.4
        this.isFading = false
        this.shuffleEnabled = false
        this.shuffledPlaylist = []

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
        this.shuffleBtn?.addEventListener('click', function () {
            self.shuffle()
        })
        this.repeatBtn?.addEventListener('click', function () {
            self.repeat()
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

            // Add a click event listener on the document to detect clicks outside
            const outsideClickListener = function (event) {
                // Check if the click target is outside the playlist
                if (!self.playlistmenu.contains(event.target) && !self.playlistBtn.contains(event.target)) {
                    self.togglePlaylist() // Close the playlist
                    document.removeEventListener('click', outsideClickListener) // Unbind the listener
                }
            };
        
            // Use a timeout to ensure the event listener is added after the toggle
            setTimeout(() => document.addEventListener('click', outsideClickListener), 0)
        })
        this.volumeBtn.addEventListener('click', function () {
            self.toggleVolume()

            // Add a click event listener on the document to detect clicks outside
            const outsideClickListener = function (event) {
                // Check if the click target is outside the volume overlay
                if (!self.volumeOverlay.contains(event.target) && !self.volumeOverlay.contains(event.target)) {
                    self.toggleVolume() // Close the volume overlay
                    document.removeEventListener('click', outsideClickListener) // Unbind the listener
                }
            };
        
            // Use a timeout to ensure the event listener is added after the toggle
            setTimeout(() => document.addEventListener('click', outsideClickListener), 0)
        })
        this.volumeOverlay.addEventListener('click', function () {
            // self.toggleVolume()
        })

        this.volumeSlider.value = self.globalVolume * 100
        this.volumeSlider.addEventListener('change', (e) => {
            self.volume(e.target.value / 100, e)
        })

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
            // Display the first track.
            self.loadTrack(self.index)

            // Setup the playlist display.
            self.playlist.forEach(function (song) {
                var div = document.createElement('div')
                div.className = 'list-song'
                div.innerHTML = song.title
                div.onclick = function () {
                    self.skipTo(self.playlist.indexOf(song))
                }
                self.list.appendChild(div)
            })
        } else {
            console.warn ('Playlist is empty!')
        }
    }

    shuffle() {
        var self = this
        self.shuffleEnabled = !self.shuffleEnabled
        if (self.shuffleEnabled) {
            self.shuffleBtn?.classList.add('active')
            self.setShuffledPlaylist()
        } else {
            self.shuffleBtn?.classList.remove('active')
        }
    }

    setShuffledPlaylist() {
        var self = this
        if (self.shuffleEnabled) {
            // Clone the original playlist to avoid modifying it directly
            self.shuffledPlaylist = [...self.playlist];

            // Implementing the Fisher-Yates shuffle algorithm
            for (let i = self.shuffledPlaylist.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [self.shuffledPlaylist[i], self.shuffledPlaylist[j]] = [self.shuffledPlaylist[j], self.shuffledPlaylist[i]];
            }
        }
    }

    async play(index) {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        index = typeof index === 'number' ? index : self.index
        var data = self.playlist[index]

        if (sound) {
            // Begin playing the sound.
            await sound.play()

            // var soundId = sound._sounds[0]?._id
            // sound.volume(1, soundId)
            // Howler.volume(1)

            // Update the track display.
            self.track.innerHTML = (index + 1) + '. ' + data.title

            //Update the repeat control btn
            if (sound._loop) self.repeatBtn?.classList.add('active')
                else self.repeatBtn?.classList.remove('active')

            // Update the pause button.
            if (sound.state() === 'loaded') {
                self.playBtn.style.display = 'none'
                self.pauseBtn.style.display = 'block'
            } else {
                self.loading.style.display = 'block'
                self.playBtn.style.display = 'none'
                self.pauseBtn.style.display = 'none'
            }
        }
    }

    async loadTrack(index) {
        const self = this
        let sound

        index = typeof index === 'number' ? index : self.index
        const data = self.playlist[index]

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl
        } else {
            sound = data.howl = new Howl({
                src: [data.file],
                html5: this.html5, // Force to HTML5 so that the audio can stream in (best for large files).
                volume: this.globalVolume,
                loop: this.loop,
                onplay: function () {
                    // Display the duration.
                    self.duration.innerHTML = self.formatTime(Math.round(sound.duration()))

                    // Stop the loading blip animation
                    self.loading.style.display = 'none'

                    // Start updating the progress of the track.
                    requestAnimationFrame(self.step.bind(self))

                    // Start the wave animation if we have already loaded
                    self.wave.container.style.display = 'block'
                    self.bar.style.display = 'none'
                    self.pauseBtn.style.display = 'block'

                    console.info(`Playing: ${data.title}`)

                    if (typeof self.onPlay === 'function') self.onPlay()
                },
                onplayerror: function (id, e) {
                    console.error(`Play error! ${e}`)
                },
                onload: function () {
                    // Stop the loading blip animation
                    self.loading.style.display = 'none'

                    console.info(`Loaded: ${data.title}`)
                    
                    if (typeof self.onLoad === 'function') self.onLoad()
                },
                onloaderror: function (id, e) {
                    console.error(`Load error! ${e}`)
                },
                onend: async function () {
                    if (!this._loop) {
                        // Stop the wave animation.
                        self.wave.container.style.display = 'none'
                        self.bar.style.display = 'block'
                        await self.skip('next')
                        self.play()
                    }
                    
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
                },
                onfade: function () {
                    // Some fade just ended
                    self.isFading = false

                    if (typeof self.onFadeTempFn === 'function') self.onFadeTempFn()
                    if (typeof self.onFade === 'function') self.onFade()
                }
            })
        }

        if (sound) {
            // Update the track display.
            self.track.innerHTML = (index + 1) + '. ' + data.title

            // Update the repeatBtn
            if (sound._loop) self.repeatBtn?.classList.add('active')
                else self.repeatBtn?.classList.remove('active')
            console.info(`loading ${data.title}...`)
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

    repeat() {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        // Toggle loop for this sound.
        sound.loop(!sound._loop)

        // Check or uncheck the repeat control button.
        if (sound._loop) self.repeatBtn?.classList.add('active')
            else self.repeatBtn?.classList.remove('active')
    }

    /**
     * Fade the current track down to a very low volume.
     */
    async fadeDown() {
        var self = this
        var sound = self.playlist[self.index].howl

        return new Promise((resolve) => {
            if (sound && sound.playing() && !self.isFading) {
                // Store the current volume
                self.fadeUpReturnToVolume = sound.volume()

                // Mark that the sound is currently fading...
                self.isFading = true
    
                // Fade the volume down to 0.01 over 1 second
                sound.fade(self.fadeUpReturnToVolume, 0.01, 1000)
    
                // After fade ends, resolve promise
                self.onFadeTempFn = () => {
                    self.onFadeTempFn = null
                    setTimeout(resolve, 1)
                }
            } else {
                // Resolve immediately if no sound is playing or if fade is already in progress.
                resolve()
            }
        });
    }

    /**
     * DOESN'T WORK. EVEN IN DESKTOP. Fade the current track back up to the last known volume.
     */
    async fadeUp() {
        var self = this
        var sound = self.playlist[self.index].howl

        return new Promise((resolve) => {
            if (sound && !self.isFading) {
                // Mark that the sound is currently fading...
                self.isFading = true

                // Fade the volume back to the previous level over 1 second
                sound.fade(0.01, self.fadeUpReturnToVolume, 1000)
    
                // After fade ends, resolve promise
                self.onFadeTempFn = () => {
                    self.onFadeTempFn = null
                    setTimeout(resolve, 1)
                }
            } else {
                // Resolve immediately if no sound is playing
                resolve()
            }
        });
    }

    /**
     * Play a random track from the playlist.
     */
    async playRandom() {
        var self = this
        if (!this.shuffleEnabled) {
            await self.shuffle()
            
            // Reset the index
            self.index = self.playlist.indexOf(self.shuffledPlaylist[0])

            // Update the playlist display
            await self.loadTrack(self.index)
        } else {
            self.skip()
        }
        await self.play()
    }

    /**
     * Get the next track based on the direction of the track, and whether playlist shuffle is enabled or not
     */
    async skip(direction) {
        var self = this

        // Determine the array to use: shuffled or normal playlist
        var playlistToUse = self.shuffleEnabled ? self.shuffledPlaylist : self.playlist;
        var currentIndex = self.shuffleEnabled ? self.shuffledPlaylist.indexOf(self.playlist[self.index]) : self.index;
        var newIndex = 0;

        // Calculate the new index based on the direction
        if (direction === 'prev') {
            newIndex = currentIndex - 1
            if (newIndex < 0) {
                newIndex = playlistToUse.length - 1
            }
        } else {
            newIndex = currentIndex + 1
            if (newIndex >= playlistToUse.length) {
                newIndex = 0
            }
        }
    
        // Find the track in the original playlist
        var newTrack = playlistToUse[newIndex]
        var newSelfIndex = self.playlist.indexOf(newTrack)
    
        // Skip to the new track
        await self.skipTo(newSelfIndex)
    }

    async skipTo(index) {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl
        var wasPlaying = sound?.playing()

        // Stop the current track.
        self.stop()

        // Reset progress.
        self.progress.style.width = '0%'

        // Load the new track.
        await self.loadTrack(index)
        if (wasPlaying) await self.play(index)
    }

    volume(val, event) {
        var self = this

        // Get the Howl we want to manipulate.
        var sound = self.playlist?.[self.index]?.howl

        // Update the global volume (affecting all Howls).
        // Howler.volume(val) 

        // Update the sound's individual volume
        sound.volume(val)
        self.globalVolume = val

        // Update the display on the slider, unless it was the slider event itself that updated the vol in the first place.
        if (!event) self.volumeSlider.value = val * 100

        console.log(`Volume value: ${val}`)
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
        var display = (self.playlistmenu.style.display === 'block') ? 'none' : 'block'

        setTimeout(function () {
            self.playlistmenu.style.display = display
        }, (display === 'block') ? 0 : 500)
        if (display === 'block') {
            self.playlistmenu.classList.remove('fadeout');
            self.playlistmenu.classList.add('fadein');
        } else {
            self.playlistmenu.classList.remove('fadein');
            self.playlistmenu.classList.add('fadeout');
        }
    }

    toggleVolume() {
        var self = this
        var display = (self.volumeOverlay.style.display === 'flex') ? 'none' : 'flex'

        setTimeout(function () {
            self.volumeOverlay.style.display = display
        }, (display === 'flex') ? 0 : 500)
        if (display === 'flex') {
            self.volumeOverlay.classList.remove('fadeout');
            self.volumeOverlay.classList.add('fadein');
        } else {
            self.volumeOverlay.classList.remove('fadein');
            self.volumeOverlay.classList.add('fadeout');
        }
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
            song.howl.unload()
        }
        });

        // Reset the playlist display if needed
        while (this.list.firstChild) {
        this.list.removeChild(this.list.firstChild)
        }
    }

    async updatePlaylist(newPlaylist) {
        var self = this

        // Stop the current track.
        self.stop()

        // Unload the current playlist first
        self.unload()

        // Reset progress.
        self.progress.style.width = '0%'

        // Update to the new playlist
        self.playlist = newPlaylist

        // Set up shuffled playlist, in case Shuffle is On
        self.setShuffledPlaylist()
        
        // Reset the index
        self.index = self.shuffleEnabled ? self.playlist.indexOf(self.shuffledPlaylist[0]) : 0

        // Update the playlist display
        self.setupPlaylistDisplay()
    }
}

// Export the HowlerPlayer class as default
export default HowlerPlayer
