var send;
(async function () {
    var lastPeerId = null
    var peer = null // Own peer object
    var conn = null
    var recvIdInput = document.getElementById("receiver-id")
    var status = document.getElementById("status")
    var message = document.getElementById("message")
    var sendMessageBox = document.getElementById("sendMessageBox")
    var sendButton = document.getElementById("sendButton")
    var clearMsgsButton = document.getElementById("clearMsgsButton")
    var connectButton = document.getElementById("connect-button")
    var cueString = "<span class=\"cueMsg\">Cue: </span>"

    const themes = await fetchJSON('../styles/themes/themes.json')
    const slideshows = await fetchJSON('../slideshow/slideshow-config.json')
    const musicPlaylists = await fetchJSON('../audio/playlists.json')
    const ambiencePlaylists = await fetchJSON('../audio/ambience.json')

    populateThemesData(themes)
    populateSlideshowsData(slideshows)
    populatePlaylistData(musicPlaylists, 'update_music_playlist')
    populatePlaylistData(ambiencePlaylists, 'update_ambience_playlist')

    function initialize() {
        peer = new Peer(null, { debug: 2 })
        peer.on('open', function (id) {
            if (peer.id === null) {
                peer.id = lastPeerId
            } else {
                lastPeerId = peer.id
            }
        })
        peer.on('connection', function (c) {
            c.on('open', function () {
                c.send("Sender does not accept incoming connections")
                setTimeout(function () { c.close() }, 500)
            })
        })
        peer.on('disconnected', function () {
            status.innerHTML = "Connection lost. Please reconnect"
            peer.id = lastPeerId
            peer._lastServerId = lastPeerId
            peer.reconnect()
        })
        peer.on('close', function () {
            conn = null
            status.innerHTML = "Connection destroyed. Please refresh"
        })
        peer.on('error', function (err) {
            alert('' + err)
        })
        recvIdInput.focus()
    };

    // Function to populate theme selectbox with received data
    function populateThemesData(themes) {
        const selectElement = document.getElementById('updateTheme')
        selectElement.innerHTML = '' // empty it out first
        themes.forEach(theme => {
            const option = document.createElement('option')
            option.value = theme.name
            option.textContent = theme.name
            option.setAttribute('data-image', theme.img)
            selectElement.appendChild(option)
        })
    }

    // Function to populate slideshows selectbox with received data
    function populateSlideshowsData(slideshows) {
        const selectElement = document.getElementById('updateSlideshowContext')
        selectElement.innerHTML = '' // empty it out first
        for (const [id, config] of Object.entries(slideshows)) {
            const option = document.createElement('option')
            option.value = id
            option.textContent = config.name
            selectElement.appendChild(option)
        }
    }

    // Function to populate slideshows selectbox with received data
    function populatePlaylistData(playlist, elemId) {
        const selectElement = document.getElementById(elemId)
        selectElement.innerHTML = '' // empty it out first
        for (const [id] of Object.entries(playlist)) {
            const option = document.createElement('option')
            option.value = id
            const name = id.replace(/^dnd_/, 'D&D ').replace(/^sw_/, 'Starwars ').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
            option.textContent = name
            selectElement.appendChild(option)
        }
    }

    function populateTrackData(playlistId, musicOrAmbience) {
        // Find the selected playlist based on the playlistId
        const selectedPlaylist = musicOrAmbience === 'ambience' ? ambiencePlaylists[playlistId] : musicPlaylists[playlistId] // Access the playlist based on its ID (e.g., 'dnd_calm')

        // Clear the current select options
        const selectElement = document.getElementById(`update_${musicOrAmbience}_track`)
        selectElement.innerHTML = '' // Clear existing options

        // If the playlist is found and contains tracks, loop through them
        if (selectedPlaylist) {
            let i = 0;
            selectedPlaylist.forEach(trackPath => {
                // Extract the file name and format it using the replacements
                const title = trackPath
                    .split('/').pop() // Get the file name
                    .replace(/\.[^/.]+$/, '') // Remove file extension
                    .replace(/_s_/g, '\'s ')
                    .replace(/_m_/g, '\'m ')
                    .replace(/_t_/g, '\'t ')
                    .replace(/_d_/g, '\'d ')
                    .replace(/_/g, ' ') // Replace underscores with spaces

                // Create a new option element for the select dropdown
                const optionElement = document.createElement('option')
                optionElement.value = i // Set the value to the track number (starting at 0)
                optionElement.textContent = title // Set the displayed text to the formatted title

                // Append the option to the select element
                selectElement.appendChild(optionElement)
                i++;
            })
        }
    }

    async function createRadioButtons(containerId, groupName, currentSlideshow) {
        if (!currentSlideshow) return false
        const container = document.getElementById(containerId)
        const totalSlides = currentSlideshow.scenes?.length
        container.innerHTML = '' // Clear previous radio buttons

        for (let i = 1; i <= totalSlides; i++) {
            const radioInput = document.createElement('input')
            radioInput.type = 'radio'
            radioInput.id = `${groupName}_${i}`
            radioInput.name = groupName
            radioInput.value = i

            // Add the click event listener to the radio input
            radioInput.onclick = function (event) {
                signal(containerId + ':' + event.target.value)
            }

            const radioLabel = document.createElement('label')
            radioLabel.htmlFor = radioInput.id
            radioLabel.textContent = i
            radioLabel.classList.add('radio-button')

            // Check if the currentSlideshow contains images, and set the background-image
            if (currentSlideshow.scenes[i - 1]) {
                const config = currentSlideshow.scenes[i - 1]
                let imageUrl
                const fromTop = config.focalPointDistanceFromTop ?? '50%'
                const fromLeft = config.focalPointDistanceFromLeft ?? '50%'
                let title
                if (config.image) {
                    imageUrl = `../${config.image}`
                } else if (config.url) {
                    const url = config.url
                    const response = await fetch('../' + url)
                    const htmlString = await response.text() // Get HTML as text

                    // Create a temporary DOM element to parse the HTML string
                    const tempDiv = document.createElement('div')
                    tempDiv.innerHTML = htmlString

                    // Check if there is an <img> tag in the parsed HTML
                    if (tempDiv.querySelector('.slideshow-content img')) {
                        imageUrl = `../${tempDiv.querySelector('img').getAttribute('src')}`
                        console.log('Image URL:', imageUrl)
                    }
                }
                if (config.caption) {
                    title = config.caption
                    if (config.subcap) {
                        title += `\n${config.subcap}`
                    }
                }
                radioLabel.style.backgroundImage = `url("${imageUrl}")`
                radioLabel.style.backgroundSize = 'cover'
                radioLabel.style.backgroundPosition = `${fromLeft} ${fromTop}`
                if (title) radioLabel.title = title
            }

            container.appendChild(radioInput)
            container.appendChild(radioLabel)
        }
    }

    function join() {
        if (conn) { conn.close() }
        conn = peer.connect(recvIdInput.value, { label: 'CONTROLLER', reliable: true })
        conn.on('open', function () {
            status.innerHTML = "Connected to: " + conn.peer
        })
        conn.on('data', function (data) {
            if (typeof data === 'object') {
                handleDataObject(data)
            } else {
                addMessage("<span class=\"peerMsg\">Peer:</span> " + data)
            }
        })
        conn.on('close', function () {
            status.innerHTML = "Connection closed"
        })
    };

    signal = function (sigName) {
        if (conn && conn.open) {
            conn.send(sigName)
            addMessage(cueString + sigName)
        } else {
            console.error('No connection found.')
            alert('No connection found.')
        }
    }

    async function handleDataObject(data) {
        if (data.controllerData) {
            const obj = data.controllerData

            if (obj.hasOwnProperty('currentTheme')) handleCurrentThemeData(obj)
            if (obj.hasOwnProperty('currentSlideshow')) await handleCurrentSlideshowData(obj)
            if (obj.hasOwnProperty('currentSlideshowId')) handleCurrentSlideshowIdData(obj)
            if (obj.hasOwnProperty('currentSlideNum') && typeof obj.currentSlideNum === 'number') handleCurrentSlideNumData(obj)
            if (obj.hasOwnProperty('initiativeActive') && obj.initiativeActive === true) handleInitiativeActiveData()
            if (obj.hasOwnProperty('currentMusicPlaylist')) handleCurrentMusicPlaylistData(obj)
            if (obj.hasOwnProperty('currentMusicTrack')) handleCurrentMusicTrackData(obj)
            if (obj.hasOwnProperty('currentMusicVolume')) handleCurrentMusicVolumeData(obj)
            if (obj.hasOwnProperty('musicIsPlaying')) handleMusicIsPlayingData(obj.musicIsPlaying)
            if (obj.hasOwnProperty('musicIsLooping')) handleMusicIsLoopingData(obj.musicIsLooping)
            if (obj.hasOwnProperty('musicIsShuffling')) handleMusicIsShufflingData(obj.musicIsShuffling)
            if (obj.hasOwnProperty('ambienceIsPlaying')) handleAmbienceIsPlayingData(obj.ambienceIsPlaying)
            if (obj.hasOwnProperty('currentAmbienceVolume')) handleCurrentAmbienceVolumeData(obj)
            if (obj.hasOwnProperty('currentAmbiencePlaylist')) handleCurrentAmbiencePlaylistData(obj)
            if (obj.hasOwnProperty('currentAmbienceTrack')) handleCurrentAmbienceTrackData(obj)
            if (obj.hasOwnProperty('currentPlayers')) handleCurrentPlayersData(obj)
        }
    }

    // Function to handle currentTheme data
    function handleCurrentThemeData(obj) {
        document.getElementById('updateTheme').value = obj.currentTheme
        const themeImage = document.getElementById('updateTheme').selectedOptions[0].getAttribute('data-image')
        document.getElementById('back_to_initiative').style.backgroundImage = `url("${themeImage}")`
    }

    // Function to handle currentSlideshow data and create radio buttons
    async function handleCurrentSlideshowData(obj) {
        await createRadioButtons('go_to_slide', 'goToSlideGroup', obj.currentSlideshow)
    }

    // Function to handle currentSlideshowId data
    function handleCurrentSlideshowIdData(obj) {
        document.getElementById('updateSlideshowContext').value = obj.currentSlideshowId
    }

    // Function to handle currentSlideNum data
    function handleCurrentSlideNumData(obj) {
        const radioToCheck = document.querySelector(`input[name="goToSlideGroup"][value="${obj.currentSlideNum}"]`)

        if (radioToCheck) {
            radioToCheck.checked = true
        }

        if (obj.currentSlideNum > 0) {
            document.getElementById('back_to_initiative').classList.remove('active')
            document.getElementById('go_to_slide').classList.add('active')
        }
    }

    // Function to handle initiativeActive data
    function handleInitiativeActiveData() {
        document.getElementById('back_to_initiative').classList.add('active')
        document.getElementById('go_to_slide').classList.remove('active')
    }

    // Function to handle currentPlayers data and populate the table
    function handleCurrentPlayersData(obj) {
        const players = obj.currentPlayers

        const table = document.getElementById('initiative_order').querySelector('table')

        // Clear the table before inserting new rows
        table.innerHTML = ''

        // Loop through each player and create a row
        players.forEach(player => {
            const row = document.createElement('tr')

            // Create and append the "name" cell
            const nameCell = document.createElement('td')
            nameCell.textContent = player.name
            row.appendChild(nameCell)

            // Create and append the "order" cell
            const orderCell = document.createElement('td')
            orderCell.textContent = player.order
            row.appendChild(orderCell)

            // Create and append the "badge" cell (if it exists)
            const badgeCell = document.createElement('td')
            badgeCell.textContent = player.badge || '-' // Show a dash if no badge
            row.appendChild(badgeCell)

            // Create and append the "status" cell (for dead/bloodied)
            const statusCell = document.createElement('td')
            if (player.dead) {
                statusCell.textContent = 'Dead'
            } else if (player.bloodied) {
                statusCell.textContent = 'Bloodied'
            } else {
                statusCell.textContent = 'Healthy'
            }
            row.appendChild(statusCell)

            // Append the row to the table
            table.appendChild(row)
        })
    }

    function handleCurrentMusicVolumeData(obj) {
        const newVol = obj.currentMusicVolume
        if (typeof newVol === 'number') document.getElementById('volume_music').value = newVol * 100
    }

    function handleCurrentMusicPlaylistData(obj) {
        document.getElementById('update_music_playlist').value = obj.currentMusicPlaylist
        populateTrackData(obj.currentMusicPlaylist, 'music')
    }
    
    function handleCurrentMusicTrackData(obj) {
        document.getElementById('update_music_track').value = obj.currentMusicTrack
    }

    function handleMusicIsPlayingData(isPlaying) {
        if (isPlaying) document.querySelector('.music-player').classList.add('playing')
        else document.querySelector('.music-player').classList.remove('playing')
    }

    function handleMusicIsLoopingData(isLooping) {
        if (isLooping) document.querySelector('.music-player').classList.add('looping')
        else document.querySelector('.music-player').classList.remove('looping')
    }

    function handleMusicIsShufflingData(isShuffling) {
        if (isShuffling) document.querySelector('.music-player').classList.add('shuffling')
        else document.querySelector('.music-player').classList.remove('shuffling')
    }

    function handleAmbienceIsPlayingData(isPlaying) {
        if (isPlaying) document.querySelector('.ambience-player').classList.add('playing')
        else document.querySelector('.ambience-player').classList.remove('playing')
    }

    function handleCurrentAmbienceVolumeData(obj) {
        const newVol = obj.currentAmbienceVolume
        if (typeof newVol === 'number') document.getElementById('volume_ambience').value = newVol * 100
    }

    function handleCurrentAmbiencePlaylistData(obj) {
        document.getElementById('update_ambience_playlist').value = obj.currentAmbiencePlaylist
        populateTrackData(obj.currentAmbiencePlaylist, 'ambience')
    }
    
    function handleCurrentAmbienceTrackData(obj) {
        document.getElementById('update_ambience_track').value = obj.currentAmbienceTrack
    }

    function addMessage(msg) {
        var now = new Date()
        var h = now.getHours()
        var m = addZero(now.getMinutes())
        var s = addZero(now.getSeconds())
        if (h > 12) h -= 12; else if (h === 0) h = 12
        function addZero(t) { if (t < 10) t = "0" + t; return t };
        message.innerHTML = `${message.innerHTML}<span class="msg-time">${h}:${m}:${s}</span> - ${msg}<br/>`
        message.scrollTo({
            top: message.scrollHeight,
            behavior: 'smooth'
        })
    }

    function clearMessages() {
        message.innerHTML = ""
        addMessage("Msgs cleared")
    }

    async function fetchJSON(url) {
        const response = await fetch(url)
        return response.json()
    }

    document.getElementById('update_music_playlist').addEventListener('change', function (e) {
        populateTrackData(e.target.value, 'music')
    })
    document.getElementById('update_ambience_playlist').addEventListener('change', function (e) {
        populateTrackData(e.target.value, 'ambience')
    })

    sendMessageBox.addEventListener('keypress', function (e) {
        if (e.key == 'Enter') sendButton.click()
    })

    sendButton.addEventListener('click', function () {
        if (conn && conn.open) {
            var msg = sendMessageBox.value
            sendMessageBox.value = ""
            conn.send(msg)
            addMessage("<span class=\"selfMsg\">Self: </span>" + msg)
        }
    })

    clearMsgsButton.addEventListener('click', clearMessages)
    connectButton.addEventListener('click', join)
    recvIdInput.addEventListener('keypress', function (e) {
        if (e.key == 'Enter') connectButton.click()
    })
    initialize()
})();

