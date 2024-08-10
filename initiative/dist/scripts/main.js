import HowlerPlayer from './howlerPlayer.js'

/**
 * Declarations
*/
let recognition // SpeechRecognition object
let grammarList // SpeechGrammarList object
let micAllowed = false
let chosenFont
let fontAllCaps = true
let chosenTheme
let Audio
let playlistJSON
let combatPlaylist = 'dnd_combat'
let combatMusicOn = false
let useOpenAI = true
let liveTextMode = true
let players = []
let currentTurn = 0
let currentRound = 1
let final_recognized_transcript
let currentSlideshowID
let slideshow = {}
let slideshowConfig = {}
let allTranscripts = []
let singleDigitRegexPatterns
let promptNames = []
let isiOS;
let aliasMap = {
    'brinley': 'brynlee',
    'zoe': 'zoey',
    'cal': 'kal',
    'casey': 'kacie',
    'tensing': 'tenzing',
    'car': 'kaa'
}
const numberMapSingleDigit = {
    'zero': 0,
    'one': 1, 'won': 1, 'want': 1,
    'two': 2, 'to': 2, 'too': 2, 'ii': 2,
    'three': 3, 'tree': 3, 'iii': 3,
    'four': 4, 'fore': 4, 'for': 4, 'forth': 4, 'fourth': 4, 'fourths': 4, '4th': 4, '4ths': 4, 'iv': 4,
    'five': 5, 'fi': 5, 'fife': 5, 'v': 5, "vie": 5,
    'six': 6, 'sex': 6, 'sixth': 6, 'sixths': 6, '6th': 6, '6ths': 6, 'vi': 6,
    'seven': 7, '7th': 7, '7ths': 7, 'seventh': 7, 'sevenths' : 7, 'vii': 7,
    'eight': 8, 'eights': 8, 'ate': 8, 'eighth': 8, 'eighths': 8, '8th': 8, '8ths': 8, 'viii': 8,
    'nine': 9, 'nigh': 9, 'ni' : 9, 'ninth': 9, 'ninths': 9, '9th': 9, '9ths': 9, 'ix': 9
}
const numberMapDoubleDigit = {
    'ten': 10, 'tin': 10, 'tenth': 10, 'tenths': 10, '10th': 10, '10ths': 10,
    'eleven': 11, 'eleventh': 11, 'elevenths': 11, '11th': 11, '11ths': 11,
    'twelve': 12, 'twelveth': 12, '12th': 12, 'twelveths': 12, '12ths': 12,
    'thirteen': 13, 'thirteenth': 13, '13th': 13, 'thirteenths': 13, '13ths': 13,
    'fourteen': 14, 'fourteenth': 14, '14th': 14, 'fourteenths': 14, '14ths': 14,
    'fifteen': 15, 'fifteenth': 15, '15th': 15, 'fifteenths': 15, '15ths': 15,
    'sixteen': 16, 'sixteenth': 16, '16th': 16, 'sixteenths': 16, '16ths': 16,
    'seventeen': 17, 'seventeenth': 17, '17th': 17, 'seventeenths': 17, '17ths': 17,
    'eighteen': 18, 'eighteenth': 18, '18th': 18, 'eighteenths': 18, '18ths': 18,
    'nineteen': 19, 'nineteenth': 19, '19th': 19, 'nineteenths': 19, '19ths': 19,
    'twenty': 20, 'twentieth': 20, 'twentieths': 20, '20th': 20, '20ths': 20,
    'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
    'twenty-four': 24, 'twenty-fourth': 24, 'twenty-five': 25,
    'twenty-six': 26, 'twenty-sixth': 26, '26th': 26,
    'twenty-seven': 27, 'twenty-seventh': 27, '27th': 27,
    'twenty-eight': 28, 'twenty-eighth': 28, '28th': 28,
    'twenty-nine': 29, 'twenty-ninth': 29, '29th': 29,
    'thirty': 30, 'thirtieth': 30, '30th': 30,
    'thirty-one': 31, 'thirty-two': 32
}
const aliasesForRolled = ['rolled', 'rolls', 'roll', 'roles', 'role', 'roads', 'road', 'rd', 'ruled', 'rules', 'rule', 'world', 'whirled', 'whirl', 'wrote', 'rote']


/**
 * Window Load
 */
window.onload = async function () {
    await main()
}


/**
 * Main Function
 */
async function main() {
    calculateGlobalVars()
    await fetchSlideshowConfigs()
    mergeSlideshowDataWithHomebrew()
    await fetchAudioPlaylists()
    setupAudioPlayer()
    rehydrateSettings()
    hydrateInitiativeFromQueryStr()
    setupDomAndEventListeners()
    await testMicPermission()
    if (!useOpenAI) await setupSpeechDicatation()
    updateSlideBasedOnHash(false)
    outputLogsToSettingsPage()
}

async function fetchAudioPlaylists () {
    playlistJSON = await fetchJSON('./audio/playlists.json')
}

async function setupAudioPlayer (playlistArray) {
    Audio = new HowlerPlayer(playlistArray)
    Audio.onPlay = function(e) {
        combatMusicOn = true
        document.body.classList.add('music-on')
    }
    Audio.onPause = function(e) {
        combatMusicOn = false
        document.body.classList.remove('music-on')
    }
    Audio.onStop = function(e) {
        combatMusicOn = false
        document.body.classList.remove('music-on')
    }
}

async function updateHowlPlaylist (playlistID) {
    let thisPlaylistArray = playlistJSON[playlistID]
    if (thisPlaylistArray) {
        // Transform the playlist array into the desired JSON object format
        thisPlaylistArray = thisPlaylistArray.map(filePath => ({
            title: filePath.split('/').pop().replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            file: filePath,
            howl: null
        }));
        if (Audio) {
            Audio.updatePlaylist(thisPlaylistArray)
        } else {
            setupAudioPlayer(thisPlaylistArray)
        }
    } else {
        console.warn('No playlist by that name in playlist JSON file(s).')
    }
}

function calculateGlobalVars() {
    isiOS = navigator.userAgent.match(/(iPhone|iPod)/i)
    singleDigitRegexPatterns = (function (numberMap) {
        const patterns = {}
        for (const word in numberMap) {
            const value = numberMap[word]
            // Add the numeral itself as a string, ensuring it's added only once
            patterns[value] = value.toString()
        }
        for (const word in numberMap) {
            const value = numberMap[word]
            patterns[value] += `|${word}`
        }
        return patterns; // ex: {'one': '1|won|want|one', 'two': '2|to|too|two'}
    })(numberMapSingleDigit)
}

async function fetchSlideshowConfigs() {
    const slideshowJSON = await fetchJSON('./slideshow/slideshow-config.json')
    if (slideshowJSON) {
        // Update global var
        slideshowConfig = slideshowJSON
    }
}

function parseHomebrewSlideshowCookie() {
    let homeBrewSlideshowObj
    const savedHomebrewJsonCookieString = getCookie('savedHomebrewJson');
    if (savedHomebrewJsonCookieString) {
        try {
            homeBrewSlideshowObj = JSON.parse(decodeURIComponent(savedHomebrewJsonCookieString))
        } catch (err) {
            console.error('Unable to parse Homebrew Slideshow JSON from saved cookie.', err)
        }
    }
    return homeBrewSlideshowObj
}

function mergeSlideshowDataWithHomebrew() {
    try {
        const homeBrewSlideshowObj = parseHomebrewSlideshowCookie()

        // Merge the parsed object to the fetched slideshowConfig
        for (const key in homeBrewSlideshowObj) {
            if (homeBrewSlideshowObj.hasOwnProperty(key)) {
                slideshowConfig[key] = homeBrewSlideshowObj[key];
            }
        }
    } catch (err) {
        alert(`Unable to parse Homebrew Slideshow JSON from saved cookie. Error: ${err.message}`)
    }
}

function rehydrateSettings() {
    /* Rehydrate the font config from cookie */
    chosenFont = getCookie('fontPreference') || 'font-eordeoghlakat'
    setCookie('fontPreference', chosenFont)
    document.body.classList.add(chosenFont)
    populateSelectWithFonts()

    /* Rehydrate the chosen theme */
    chosenTheme = getCookie('themePreference') || 'D&D'
    setCookie('themePreference', chosenTheme)
    populateSelectWithThemes()
    const themeOptionElem = document.querySelector(`#selectTheme option[value="${chosenTheme}"]`)
    loadCSS(themeOptionElem?.dataset.css)
    updateFont(themeOptionElem?.dataset.font)

    /* Rehydrate combat music playlist selection */
    const combatPlaylistCookieValue = getCookie('combatPlaylist');
    if (combatPlaylistCookieValue) combatPlaylist = combatPlaylistCookieValue
    if (combatPlaylist) updateHowlPlaylist(combatPlaylistCookieValue)
    populateSelectWithPlaylists()
    document.querySelectorAll('#selectCombatPlaylist, #selectAudioPlayerPlaylist').forEach(sel => sel.value = combatPlaylist)

    /* Rehydrate the font capitalization preference */
    fontAllCaps = getCookie('fontAllCaps') || 'true'
    const fontToggleElem = document.getElementById('toggleFontAllCaps')
    if (fontToggleElem) fontToggleElem.checked = fontAllCaps === 'true'
    document.documentElement.style.setProperty('--adjustable-text-transform', fontAllCaps === 'true' ? 'uppercase' : 'capitalize')
    
    /* Rehydrate the live text preference */
    liveTextMode = getCookie('liveTextMode') || 'true'
    document.getElementById('toggleLiveText').checked = liveTextMode === 'true'
    
    /* Rehydrate the useOpenAI preference */
    useOpenAI = getCookie('useOpenAI') || 'true'
    document.getElementById('toggleUseOpenAI').checked = useOpenAI === 'true'
    if (useOpenAI) {
        document.getElementById('promptNames')?.closest('.settings-menu-group')?.classList.add('active')
        document.getElementById('toggleLiveText')?.closest('.settings-menu-group')?.classList.remove('active')
    } else {
        document.getElementById('promptNames')?.closest('.settings-menu-group')?.classList.remove('active')
        document.getElementById('toggleLiveText')?.closest('.settings-menu-group')?.classList.add('active')
    }

    /* Rehydrate the custom prompt names */
    const stringifiedPromptNames = getCookie('promptNamesArray') || '["orc"]'
    promptNames = JSON.parse(stringifiedPromptNames)
    document.getElementById('promptNames').value = promptNames.join(', ')
    
    /* Rehydrate the app scale from cookie */
    const cookieAppScale = getCookie('appScalePreference') || 2
    document.getElementById('appScalePref').value = parseFloat(cookieAppScale)
    document.documentElement.style.setProperty('--adjustable-app-scale', (parseFloat(cookieAppScale) * 8) + 'px')
    
    /* Rehydrate the brightness config from cookie */
    const cookieBrightness = getCookie('brightnessPreference') || 1
    document.getElementById('brightnessPref').value = parseFloat(cookieBrightness)
    document.documentElement.style.setProperty('--brightness-level', parseFloat(cookieBrightness))
    
    /* Rehydrate the font size config from cookie */
    const cookieFontSize = getCookie('fontSizePreference') || 2
    document.getElementById('fontSizePref').value = parseFloat(cookieFontSize)
    document.documentElement.style.setProperty('--adjustable-font-size', parseFloat(cookieFontSize) + 'rem')
    
    /* Rehydrate the font size config from cookie */
    const cookieChalkiness = getCookie('chalkinessPreference') || 0.75
    document.getElementById('chalkinessPref').value = parseFloat(cookieChalkiness)
    document.documentElement.style.setProperty('--adjustable-chalkiness', 1 - parseFloat(cookieChalkiness))
    
    /* Rehydrate the selected slideshow from cookie */
    const cookieSlideshowValue = getCookie('slideshowPreference') || ''
    document.getElementById('selectSlideshow').value = cookieSlideshowValue
    updateSlideshowContext(cookieSlideshowValue)
    populateSelectWithSlideshows()

    /* Rehydrate the next slide to show from cookie */
    const cookieNextSlideToShowValue = getCookie('slideshowNextSlidePreference') || '1'
    document.getElementById('slideshowNextSlide').value = parseInt(cookieNextSlideToShowValue)
    populateSelectWithSlideNumbers()
    updateNextSlideToShow(cookieNextSlideToShowValue)

    /* Rehydrate slideshow JSON textarea from cookie */
    const savedHomebrewObj = parseHomebrewSlideshowCookie()
    if (savedHomebrewObj && Object.keys(savedHomebrewObj).length > 0) {
        document.getElementById('homebrewSlideshowJSON').value = JSON.stringify(savedHomebrewObj, null, 2)
    }

    /* Rehydrate the current player entries from cookie */
    const savedPlayers = getCookie('players')
    if (savedPlayers) {
        players = JSON.parse(savedPlayers)
        const prevPlayersTranscript = generatedPlayersTranscript(players)
        allTranscripts.push(prevPlayersTranscript)
        renderPlayers()
    }
    
    /* Rehydrate the current round, if it was recorded */
    const savedRound = getCookie('round')
    if (savedRound) {
        currentRound = parseInt(savedRound, 10)

        /* Rehydrate the tally marks on page refresh */
        if (savedRound > 0) {
            updateTally(savedRound)
        }
    }

    /* Rehydrate the current turn, if it was recorded */
    const turnStarted = getCookie('turnStarted')
    if (turnStarted) {
        beginCombat()
    }
    const savedTurn = getCookie('turn')
    if (savedTurn) {
        currentTurn = parseInt(savedTurn, 10)
        highlightCurrentTurn(true)
    }
}

function hydrateInitiativeFromQueryStr() {
    const urlParams = new URLSearchParams(window.location.search)

    // Hydrate the current round from the query string
    const roundParam = urlParams.get('round')
    if (roundParam) {
        currentRound = parseInt(roundParam, 10)
        if (currentRound > 0) {
            updateTally(currentRound)
        }
    }

    // Hydrate the current turn from the query string
    const turnParam = urlParams.get('turn')
    const turnNumber = parseInt(turnParam, 10)
    if (typeof turnNumber === 'number' && turnNumber > 1) {
        currentTurn = turnNumber - 1
    } else {
        currentTurn = 1
    }
    highlightCurrentTurn(true)

    // Hydrate the players from the query string
    const playersParam = urlParams.get('players')
    if (playersParam) {
        try {
            players = JSON.parse(playersParam)
            allTranscripts = [generatedPlayersTranscript(players)]
            addPlayersAndGo()
        } catch (error) {
            console.error('Error parsing players from query string:', error)
        }
    }
}

function setupDomAndEventListeners() {
    document.getElementById('copyQueryStringToClipboard').addEventListener('click', copyInitiativeOrderToClipboard)
    document.getElementById('initiativeUrlPasteAndGo').addEventListener('click', reloadWithPastedInitiativeUrl)
    document.getElementById('refreshPageBtn').addEventListener('click', refreshPage)
    document.getElementById('settingsMenuOpenBtn').addEventListener('click', openSettingsMenu)
    document.getElementById('settingsMenuReturnBtn').addEventListener('click', settingsMenuReturn)
    document.getElementById('musicBtn').addEventListener('click', handleMusicBtnClick)
    document.getElementById('toggleFullScreenBtn').addEventListener('change', toggleFullScreenMode)
    document.getElementById('selectTheme').addEventListener('change', handleThemeChange)
    document.getElementById('toggleLiveText').addEventListener('change', toggleLiveTextMode)
    document.getElementById('toggleUseOpenAI').addEventListener('change', toggleUseOpenAI)
    document.getElementById('promptNames').addEventListener('keydown', (e)=> {handlePromptNamesKeyDown(e)})
    document.getElementById('promptNames').addEventListener('input', (e)=> {updatePromptNames(e.target.value)})
    document.getElementById('appScalePref').addEventListener('change', (e)=> {updateAppScale(e.target.value)})
    document.getElementById('decrAppScale').addEventListener('click', decreaseAppScale)
    document.getElementById('incrAppScale').addEventListener('click', increaseAppScale)
    document.getElementById('brightnessPref').addEventListener('change', (e)=> {updateBrightnessLevel(e.target.value)})
    document.getElementById('decrBrightness').addEventListener('click', decreaseBrightness)
    document.getElementById('incrBrightness').addEventListener('click', increaseBrightness)
    document.getElementById('selectFont')?.addEventListener('change', handleFontChange)
    document.getElementById('fontSizePref').addEventListener('change', (e)=> {updateFontSize(e.target.value)})
    document.getElementById('decrFontSize').addEventListener('click', decreaseFontSize)
    document.getElementById('incrFontSize').addEventListener('click', increaseFontSize)
    document.getElementById('toggleFontAllCaps')?.addEventListener('change', togglefontAllCaps)
    document.getElementById('chalkinessPref').addEventListener('change', (e)=> {updateChalkiness(e.target.value)})
    document.getElementById('decrChalkiness').addEventListener('click', decreaseChalkiness)
    document.getElementById('incrChalkiness').addEventListener('click', increaseChalkiness)
    document.getElementById('openMusicMenu').addEventListener('click', ()=> openSettingsSubMenu('musicMenu'))
    document.getElementById('openSlideshowMenu').addEventListener('click', ()=> openSettingsSubMenu('slideshowMenu'))
    document.getElementById('selectSlideshow').addEventListener('change', handleSlideshowChange)
    document.getElementById('slideshowNextSlide').addEventListener('change', handleSlideshowSlideChange)
    document.getElementById('homebrewSlideshowJSON').addEventListener('input', handleHomebrewSlideshowJsonChange, {once: true})
    document.getElementById('homebrewSlideshowJSON').addEventListener('keydown', handleHomebrewSlideshowJsonTab)
    document.getElementById('homebrewSlideshowSave').addEventListener('click', handleHomebrewSlideshowSave)
    document.querySelectorAll('#selectCombatPlaylist, #selectAudioPlayerPlaylist').forEach(sel => sel.addEventListener('change', handleCombatPlaylistChange))
    document.getElementById('speechForm').addEventListener('submit', handleManualInputSubmit)
    document.getElementById('addPlayer').addEventListener('click', addPlayer)
    document.getElementById('prevTurn').addEventListener('click', goBackOneTurn)
    document.getElementById('nextTurn').addEventListener('click', advanceTurn)
    document.getElementById('clearAll').addEventListener('click', clearAll)
    document.getElementById('startDictation').addEventListener('click', handleDictationToggle)
    document.body.addEventListener('click', e => e.target.closest('.slide-control') && handleSlideControlClick(e))
    document.body.addEventListener('click', e => e.target.matches('label i.tooltip-icon') && handleTooltipIconClick(e))
    document.getElementById('sceneBtn').addEventListener('click', e => console.log(e.target.closest('#sceneBtn').href)) // updates the page url hash naturally. handled by updateSlideBasedOnHash().
    // document.getElementById('startDictation').addEventListener('mousedown', handleDictationMouseDown)
    // document.getElementById('startDictation').addEventListener('touchstart', handleDictationTouchStart)
    // document.getElementById('startDictation').addEventListener('mouseup', handleDictationMouseUp)
    // document.getElementById('startDictation').addEventListener('touchend', handleDictationTouchEnd)

    if (isiOS) {
        document.body.classList.add('ios')
    }
    
    const events = ['input', 'change', 'keydown', 'focus', 'focusin', 'focusout', 'blur', 'beforeinput', 'compositionstart', 'compositionupdate', 'compositionend', 'select', 'paste', 'copy', 'submit']
    events.forEach(event => {
        document.getElementById("testInput").addEventListener(event, ()=>{console.debug(event)})
    })

    function copyInitiativeOrderToClipboard() {
        const round = currentRound || 1
        const turn = currentTurn || 1
        const playersData = players || []

        // Convert players array to JSON and encode it
        const playersJson = JSON.stringify(playersData).replace(/([#\?&]|,"badge":""|,"dead":false|,"bloodied":false)/g, '')

        // Construct the full URL
        const baseUrl = `${window.location.origin}${window.location.pathname}`
        const fullUrl = `${baseUrl}?round=${round}&turn=${turn}&players=${playersJson}`

        // Create a temporary textarea element to hold the query string
        const tempTextarea = document.createElement('textarea')
        tempTextarea.value = fullUrl
        document.body.appendChild(tempTextarea)

        // Select and copy the content of the textarea to the clipboard
        tempTextarea.select()
        document.execCommand('copy')

        // Remove the temporary textarea element from the DOM
        document.body.removeChild(tempTextarea)

        // Optional: Notify the user that the data has been copied
        alert('Initiative URL copied to clipboard!')
    }

    function reloadWithPastedInitiativeUrl () {
        const inputElement = document.getElementById('pastedInitiativeUrl');
        if (inputElement) {
            const url = inputElement.value.trim();
            if (url) {
                window.location.href = url;
            } else {
                alert('Please enter a valid URL.');
            }
        } else {
            console.error('Input element with id "pastedInitiativeUrl" not found.');
        }
    }

    // Font Preference
    function handleFontChange(e) {
        const selectedClass = e.target.value
        updateFont(selectedClass)
    }    

    // Slideshow Handler
    function handleSlideshowChange(e) {
        const selectedSlideshow = e.target.value
        updateSlideshowContext(selectedSlideshow)
    }

    // Slideshow Slide Handler
    function handleSlideshowSlideChange(e) {
        const selectedSlide = e.target.value
        updateNextSlideToShow(selectedSlide)
    }

    // Validate the homebrew slideshow object (user input)
    function validateSlideshowObj(obj) {
        // If the object is empty, it's valid.
        if (Object.keys(obj).length === 0) return

        // Check if the slideshow Object is an array
        if (Array.isArray(obj)) {
            throw new Error('Object is an array, expected an object.');
        }
    
        // Check if the slideshow Object contains at least one slideshow ID
        if (Object.keys(obj).length === 0) {
            throw new Error('Object must contain at least one slideshow ID.');
        }
    
        // Check if each first-level child object in the slideshow Object contains a `name` property
        for (const key in obj) {
            if (!obj[key].hasOwnProperty('name')) {
                throw new Error(`Each slideshow must contain a "name" property. Missing in slideshow ID: "${key}".`);
            }
        }
    
        // Check if each first-level child object in the slideshow Object contains a `scenes` property with at least one `image` property
        for (const key in obj) {
            if (!obj[key].hasOwnProperty('scenes') || !Array.isArray(obj[key].scenes) || obj[key].scenes.length === 0) {
                throw new Error(`Each slideshow must contain a "scenes" property with at least one scene object. Issue found in slideshow ID: "${key}".`);
            }
    
            const hasImageProperty = obj[key].scenes.some(scene => scene.hasOwnProperty('image'));
            if (!hasImageProperty) {
                throw new Error(`Each "scenes" array must contain at least one object with an "image" property. Issue found in slideshow ID: "${key}".`);
            }
        }
    }

    // Homebrew JSON textarea edited...
    function handleHomebrewSlideshowJsonChange() {
        // Light up the Save button to the primary color.
        document.getElementById('homebrewSlideshowSave')?.classList.remove('btn-alt')
    }

    // Homebrew JSON textarea tab pressed.
    function handleHomebrewSlideshowJsonTab(e) {
        if (e.code === 'Tab') {
            e.preventDefault();
            const TAB_WIDTH = 2;
            const isShift = e.shiftKey;
            
            if (!isShift) {
                // Apply 1 space for every tab width
                document.execCommand('insertText', false, ' '.repeat(TAB_WIDTH));
            }
        }
    }
    
    // Save Homebrew Slideshow JSON
    async function handleHomebrewSlideshowSave() {
        const homebrewJson = document.getElementById('homebrewSlideshowJSON')?.value;
        let parsedJson = null;
        try {
            // If homebrewJson is empty, set parsedJson to an empty object
            parsedJson = homebrewJson.trim() === '' ? {} : JSON.parse(homebrewJson);
            validateSlideshowObj(parsedJson);
        } catch (err) {
            alert(`JSON parse error. Your code is invalid! Error: ${err.message}`);
            console.error('JSON parsing or validation error:', err);
            return;
        }
    
        if (parsedJson !== null) {
            setCookie('savedHomebrewJson', encodeURIComponent(JSON.stringify(parsedJson)));

            // Re-fetch the slideshow config file(s)
            await fetchSlideshowConfigs()

            mergeSlideshowDataWithHomebrew()

            populateSelectWithSlideshows()
            populateSelectWithSlideNumbers()
            updateNextSlideToShow('1')

            // Dim the save button to gray
            document.getElementById('homebrewSlideshowSave')?.classList.add('btn-alt')
            // Re-enable the json input handler to light the save button back up if the json changes again.
            document.getElementById('homebrewSlideshowJSON').addEventListener('input', handleHomebrewSlideshowJsonChange, {once: true})
        }
    }

    async function handleCombatPlaylistChange(e) {
        const selectedCombatPlaylist = e.target.value
        updateCombatPlaylist(selectedCombatPlaylist)
    }

    function handleDictationToggle(e) {
        this.classList.toggle('active')
        if (this.classList.contains('active')) {
            handleMicOn(e)
        } else {
            handleMicOff(e)
        }
    }

    // function handleDictationMouseDown(e) {
    //     e.preventDefault()
    //     handleMicOn()
    //     this.classList.add('active')
    // }
    
    // function handleDictationMouseUp(e) {
    //     e.preventDefault()
    //     handleMicOff()
    //     this.classList.remove('active')
    // }
    
    // function handleDictationTouchStart(e) {
    //     e.preventDefault()
    //     handleMicOn()
    //     this.classList.add('active')
    // }
    
    // function handleDictationTouchEnd(e) {
    //     e.preventDefault()
    //     handleMicOff()
    //     this.classList.remove('active')
    // }

    function handleMicOn() {
        if (micAllowed) {
            if (Audio && combatMusicOn) {
                // if music is playing, lower it or pause it before turning on the mic
                if (isiOS) Audio.pause() // if we're in iOS, pause. there's an issue with Audio.fadeDown() causing iOS to bump the volume WAY UP... TOFIX
                else Audio.fadeDown()
            }
                
            document.getElementById('startDictation').classList.add('active')
            if (!useOpenAI && 'start' in recognition) {
                recognition.start()
            } else {
                startRecording()
            }
    
        } else {
            handleMicDisallowed()
        }
    }
    
    function handleMicOff() {
        if (micAllowed) {
            if (Audio && combatMusicOn) {
                // if music was playing, fade it back in or unpause after turning off the mic
                if (isiOS) Audio.play()
                else Audio.fadeUp()
            }
            document.getElementById('startDictation').classList.remove('active')
            document.getElementById('startDictation').classList.add('thinking')
            document.getElementById('startDictation').disabled = true
            if (!useOpenAI && 'stop' in recognition) {
                recognition.stop()
            } else {
                stopRecording()
            }
        }
        console.debug('Mic button released, or toggled off')
    }
    
    function handleMicDisallowed() {
        micAllowed = false
        document.body.classList.add('no-mic')
        document.querySelector('.denied-mic').classList.add('show')
        document.getElementById('startDictation').classList.remove('thinking')
        document.getElementById('startDictation').classList.add('disabled')
        document.getElementById('speechForm').classList.add('show')
    }
}

/**
 * Speech handling
 */

const mimeType = getSupportedMimeTypes('audio')[0]
const audioContext = new AudioContext()

// Determine the best mime type to use for this browser/device
function getSupportedMimeTypes() {
    const prioritizedMimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4;codecs=aac',
        'audio/mp4',
        'audio/mpeg',
        'audio/aac',
        'audio/wav'
    ];

    const supportedMimeTypes = []
    for (const mimeType of prioritizedMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            supportedMimeTypes.push(mimeType)
            // return mimeType
        }
    }
    if (supportedMimeTypes.length === 0) {
        console.error("No suitable MIME type found for this device")
        return null
    }
    return supportedMimeTypes
}

let mediaRecorder
let speechChunks = []
const minRecordingTime = 0.5 // 0.5 seconds
const maxRecordingTime = 30 // 30 seconds
let recordingTimeout

// Capture speech
async function startRecording() {
    try {
        speechChunks = [] // Clear previous recordings
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType })
        mediaRecorder.ondataavailable = event => speechChunks.push(event.data)
        mediaRecorder.start()
        console.log('recording...')
        // Set a timeout to automatically stop recording after maxRecordingTime
        recordingTimeout = setTimeout(() => {
            stopRecording()
        }, maxRecordingTime * 1000)
    } catch (err) {
        console.error('Error:', err)
    }
}

// Convert captured speech to wav, then send to AWS API endpoint (for OpenAI to transcribe)
function stopRecording() {
    mediaRecorder.stop()
    console.log('recording stopped')
    clearTimeout(recordingTimeout) // Clear the timeout
    
    mediaRecorder.onstop = async () => {
        // Create audio buffer from recorded speech
        const speechBlob = new Blob(speechChunks, { type: mimeType })
        const arrayBuffer = await speechBlob.arrayBuffer()
        const speechBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Check the duration of the speech buffer
        const duration = speechBuffer.duration
        console.log(`Speech duration: ${duration} seconds`)

        if (duration < minRecordingTime) {
            console.warn(`Speech duration is less than ${minRecordingTime} seconds. Will not submit.`)
            return;
        }

        if (duration > maxRecordingTime) {
            console.warn(`Speech duration is greater than ${maxRecordingTime} seconds. Will not submit.`)
            return;
        }

        // Create WAV file from speech buffer
        const wavBuffer = speechBufferToWav(speechBuffer);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })
        
        const endpointUrl = 'https://ghseg8im58.execute-api.us-east-2.amazonaws.com/default/opanAiTranscribeTestPython'
        const prompt = generatePrompt(promptNames)
        const urlWithParams = `${endpointUrl}?prompt=${encodeURIComponent(prompt)}`
        
        console.log('sending recording to OpenAI transcribe API...')
        fetch(urlWithParams, {
            method: 'POST',
            headers: {
                'Content-Type': 'audio/wav',
            },
            body: wavBlob // Send the speechBlob directly
        })
        .then(response => {
            console.log(`server response.ok? ${response.ok}`)
            if (!response.ok) {
                return response.json().then(errorData => {
                    console.log(`HTTP error! status: ${response.status}`)
                    throw new Error(errorData.error)
                });
            }
            return response.json()
        })
        .then(data => {
            console.log('Results from openai...')
            let results = data.text
            console.log(`"${results}"`)
            
            let interpretedTranscript = parseInput(results)
            interpretedTranscript = trimIncompletePattern(interpretedTranscript)
            console.info(`Parsed results: ${interpretedTranscript}`)
            allTranscripts.push(interpretedTranscript)
            const joinedInput = allTranscripts.join(' ')
            parseAndAddEntries(joinedInput)
        })
        .catch(error => {
            console.log(`Error: ${error.message}`)
            console.error('Error:', error);
        })
        .finally(() => {
            document.getElementById('finalTranscript').textContent = ''
            document.getElementById('interimOutput').classList.remove('active')
            document.getElementById('startDictation').classList.remove('thinking', 'active', 'disabled')
            document.getElementById('startDictation').disabled = false
        })
    }
}

function speechBufferToWav(buffer) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        thisBuffer = new ArrayBuffer(length),
        view = new DataView(thisBuffer),
        channels = [],
        i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this demo)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // write 16-bit sample
            pos += 2;
        }
        offset++;                                      // next source sample
    }

    return thisBuffer;

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

function generatePrompt(names) {
    const ALWAYS_START_WITH = 'D&D Initiative Order: '
    const ALWAYS_END_WITH = ' Creature 1: 8, Creature 2: -1'
    let prompt = ''
    let number = names.length > 20 ? 25 : 20
    let decrement = names.length > 10 ? 1 : 2
    let numbers = []
    let usedNumbers = new Set()

    // Generate initial numbers
    for (let i = 0; i < names.length; i++) {
        if (number >= 0) {
            numbers.push(number)
            usedNumbers.add(number)
            number -= decrement
        }
    }

    // If more numbers are needed, fill in with repeats
    while (numbers.length < names.length) {
        for (let num = (names.length > 20 ? 25 : 20); num >= 0 && numbers.length < names.length; num -= decrement) {
            if (!usedNumbers.has(num) || numbers.filter(n => n === num).length < 2) {
                numbers.push(num)
            }
        }
    }

    // Generate the prompt string
    for (let i = 0; i < names.length; i++) {
        prompt += `${names[i]}: ${numbers[i]}`;
        if (i < names.length - 1) {
            prompt += ', '
        }
    }

    // Ensure the ending "Creature 1: 8, Creature 2: -1"
    prompt = ALWAYS_START_WITH + prompt.trim() + ALWAYS_END_WITH

    return prompt;
}

async function testMicPermission () {
    navigator?.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
        // User has granted microphone access
        micAllowed = true
        document.body.classList.remove('no-mic')
        
        // Now stop the speech stream
        stream.getTracks().forEach(track => track.stop())
        return true
    })
    .catch(() => {
        // Access denied or another error
        micAllowed = false
        document.body.classList.add('no-mic')
        return false
    })
}

async function setupSpeechDicatation() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition. Please use a compatible browser or manually input your speech.')
        return
    }

    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition

    // Grammar list... works?  but it miiight be eff'ing up the number interpretation.
    var SpeechGrammarList = ('webkitSpeechGrammarList' in window) ? webkitSpeechGrammarList : 'SpeechGrammarList' in window ? SpeechGrammarList : null

    var numbers = ['one','two','three','four','five','six','seven','eight','nine','ten'];
    var grammar = '#JSGF V1.0; grammar numbers; public <number> = ' + numbers.join(' | ') + ' ;'
    
    recognition = new SpeechRecognition()
    if (SpeechGrammarList) {
        grammarList = SpeechGrammarList ? new SpeechGrammarList() : null
        grammarList.addFromString(grammar, 1);
        recognition.grammars = grammarList;  // comment to turn grammar list off
    }
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 12
    recognition.onstart = speechStartHandler
    recognition.onresult = speechResultHandler
    recognition.onnomatch = speechNoMatchHandler
    recognition.onerror = speechErrorHandler
    recognition.onend = speechEndHandler

    // Asynchronously check to see if the microphone permission has been granted during the session
    micAllowed = await testMicPermission()

    var interimOutput = document.getElementById('interimOutput')
    var interimTranscriptOutput = document.getElementById('interimTranscript')
    var finalTranscriptOutput = document.getElementById('finalTranscript')
    let lastInterimTimestamp = 0
    const pauseThreshold = 250 // Pause threshold in milliseconds
    let speechProcessedEvent = new Event('speechprocessed')

    
    function speechStartHandler() {
        console.error('Speech started.')
        final_recognized_transcript = ''
    }

    function speechResultHandler(event) {
        micAllowed = true // if we got this far, mic is obviously allowed
        let interim_transcript = ''
        const currentTime = new Date().getTime();
        const pauseDetected = lastInterimTimestamp > 0 && currentTime - lastInterimTimestamp > pauseThreshold
        if (pauseDetected) {
            console.log('Pause detected: ' + (currentTime - lastInterimTimestamp) + 'ms')
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const sortedResults = sortSpeechRecognitionResults(event.results[i])
            // const probableResult = considerAlternatives(sortedResults)
            const probableResult = sortedResults[0]
            let spokenWords = probableResult.transcript.trim()

            if (event.results[i].isFinal) {
                // heard the completion of some word or phrase, and made a final decision about what it heard.
                // probably triggered by a tiny (but obvious) pause in speech

                if (isStopCommand(spokenWords)) document.getElementById('startDictation').click()

                final_recognized_transcript += ' ' + spokenWords

                let temporaryInterpretation = replaceUniqueGroupNumberWords( spokenWords )
                temporaryInterpretation = makeSpellingCorrections( temporaryInterpretation )
                temporaryInterpretation = convertNumberWordsToNumerals( temporaryInterpretation )
                finalTranscriptOutput.append(' ' + temporaryInterpretation)
                console.info(`Recognized word(s): "${spokenWords}"`)
                console.debug(`Confidence: ${probableResult.confidence}`)
                console.info(`FINAL (all recognized):\n${final_recognized_transcript}`)
                console.debug(event)
                interim_transcript = ''
            } else {
                // heard small part, maybe just a syllable, but has not yet made a final decision about what it heard.
                interim_transcript += ' ' + spokenWords
                console.debug(`sound heard: ${spokenWords}`)
            }

            lastInterimTimestamp = currentTime;
        }

        if (liveTextMode) {
            if (interim_transcript) interimOutput.classList.add('active')
            interimTranscriptOutput.innerHTML = interim_transcript
        }

        document.querySelector('.post-mic').classList.remove('show')
    }

    function speechNoMatchHandler(event) {
        const huh = ['[incoherent]', '???', '[mumbling]', '[drunken slurring]', '[something something...]'][Math.floor(Math.random() * 5)]
        interimTranscriptOutput.textContent = huh
        console.debug(event)
    }

    function speechErrorHandler(event) {
        interimTranscriptOutput.textContent = '[Error]'
        console.error(`Error occurred in recognition: ${event.error}\nError message: ${event.message}`)
        console.debug(event)
    }
    
    function speechEndHandler() {
        console.info(`Heard altogether:\n"${final_recognized_transcript}"`)
        if (isEmpty(final_recognized_transcript)) {
            if (micAllowed && players.length === 0) document.querySelector('.post-mic').classList.add('show')
        } else if (isClearCommand(final_recognized_transcript)) {
            console.info(`CLEAR command detected: "${final_recognized_transcript}"`)
            clearAll()
        } else if( isCancelCommand(final_recognized_transcript)) {
            console.info(`CANCEL command detected: "${final_recognized_transcript}"`)
            final_recognized_transcript = ''
        } else {
            let interpretedTranscript = parseInput(final_recognized_transcript)
            interpretedTranscript = trimIncompletePattern(interpretedTranscript)
            console.info(`Parsed results: ${interpretedTranscript}`)
            allTranscripts.push(interpretedTranscript)
            const joinedInput = allTranscripts.join(' ')
            parseAndAddEntries(joinedInput)
        }
        finalTranscriptOutput.textContent = ''
        interimOutput.classList.remove('active')
        document.getElementById('startDictation').classList.remove('thinking')
        document.getElementById('startDictation').disabled = false
        document.dispatchEvent(speechProcessedEvent)
    }

    function isEmpty(str) {
        // Test whether the voice transcription is empty.
        return str.trim() == ''
    }
    
    function isStopCommand(str) {
        // Test whether the last thing the user said was just "stop".
        return /.*stop$/i.test(str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
    }

    function isClearCommand(str) {
        // Test whether the user said (and only said) "clear", "cancel", "reset", "start over", "new list", "new encounter", "next encounter", "new initiaive", or "new initiaive order".
        return /^(clear|cancel|reset|start over|new list|new encounter|next encounter|new initiative|new initiative order)$/i.test(str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
    }

    function isCancelCommand(str) {
        // Test whether the user said something clearly ending with "cancel"
        return /.*cancel$/i.test(str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
    }
    
    function sortSpeechRecognitionResults(results) {
        // Sort the results array by confidence values in descending order
        const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence)
    
        // Preselect the highest confidence item
        return sortedResults
    }

    /** NOTE: AS OF 5/20/24, iOS DOES NOT RECORD ALTERNATIVES IN ITS RESULTS, WHICH MAKES THIS FUNCTION USELESS.
     * Function: Test whether the speech recognition thinks it may have heard something different, and decide
     * if that alternative is actually the better choice in this context. If not, just return the
     * result that the SpeechRecognitionResult was most confident in.
     */
    function considerAlternatives(results) {
        // Sort the results
        const sortedResults = sortSpeechRecognitionResults(results)
    
        // Preselect the highest confidence item
        let probableResult = sortedResults[0]
        let maxHits = 0
    
        const allAltTranscripts = []

        // Iterate over alternatives
        for (let i = 0; i < sortedResults.length; i++) {
            const result = sortedResults[i]
            const transcript = result.transcript
            allAltTranscripts.push(transcript)

            if (result.confidence < 0.3) continue
    
            let hitCount = 0
            // Test each number group pattern
            for (const num in singleDigitRegexPatterns) {
                const groupWords = singleDigitRegexPatterns[num]
                const regex = new RegExp(`\\b(${groupWords})(?!\\d)`, 'gi')
                let matches = transcript.match(regex) || []
                hitCount += matches.length
            }
    
            // Update the most hits result
            if (hitCount > maxHits) {
                maxHits = hitCount
                probableResult = result
                console.debug('chose alternative: ' + transcript)
            }
        }
        
        console.info(`Alternatives: ${allAltTranscripts}`)

        console.debug('dbl numeral HITS: ' + maxHits)
        return probableResult
    }
}


/**
 * App Settings Management
 */

function openSettingsMenu() {
    const bodyElement = document.querySelector('body')
    const settingsMenu = document.querySelector('.settings-menu')
    const settingsSubMenus = document.querySelectorAll('.settings-sub-menu')
    const mainAppBody = document.querySelector('.main')
    bodyElement.classList.add('menu-open')
    mainAppBody.classList.add('hide-left')
    settingsMenu.classList.remove('hide-right', 'hide-left', 'hide')
    settingsSubMenus.forEach(sub => sub.classList.add('hide-right'))
}

function openSettingsSubMenu(id) {
    const bodyElement = document.querySelector('body')
    const settingsMenu = document.querySelector('.settings-menu')
    const settingsSubMenu = document.getElementById(id)
    const mainAppBody = document.querySelector('.main')
    bodyElement.classList.add('menu-open', 'sub-menu-open')
    bodyElement.setAttribute('data-submenu', id);
    mainAppBody.classList.add('hide-left')
    settingsMenu.classList.add('hide-left')
    settingsSubMenu.classList.remove('hide-right', 'hide-left', 'hide')
}

function settingsMenuReturn() {
    const bodyElement = document.querySelector('body')
    const settingsMenu = document.querySelector('.settings-menu')
    const settingsSubMenus = document.querySelectorAll('.settings-sub-menu')
    const mainAppBody = document.querySelector('.main')
    if (bodyElement.matches('.sub-menu-open')) {
        // Return from a sub menu to settings menu
        bodyElement.classList.remove('sub-menu-open')
        bodyElement.removeAttribute('data-submenu');
        mainAppBody.classList.add('hide-left') // probly unnec
        settingsMenu.classList.remove('hide-right', 'hide-left', 'hide')
    } else {
        // Return to main app
        bodyElement.classList.remove('menu-open', 'sub-menu-open')
        mainAppBody.classList.remove('hide-right', 'hide-left', 'hide')
        settingsMenu.classList.add('hide-right')
    }
    settingsSubMenus.forEach(sub => sub.classList.add('hide-right'))
}

async function handleMusicBtnClick() {
    if (combatMusicOn) {
        combatMusicOn = false
        document.body.classList.remove('music-on')
        if (!isiOS) await Audio.fadeDown()
        await Audio.stop()
    } else {
        combatMusicOn = true
        document.body.classList.add('music-on')
        if (document.body.dataset.submenu === 'musicMenu') {
            await Audio.play()
        } else {
            await Audio.playRandom()
        }
    }
}

function handleTooltipIconClick(e) {
    e.preventDefault()
    e.stopPropagation()
    e.target.classList.toggle('active')
}

function toggleFullScreenMode() {
    if (this.checked) openFullscreen()
    else closeFullscreen()
}

/* View in fullscreen */
function openFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

function handleThemeChange(event) {
    const selectedTheme = event.target.value
    const themeOptionElem = event.target.options[event.target.selectedIndex]
    loadCSS(themeOptionElem?.dataset.css)
    updateFont(themeOptionElem?.dataset.font)
    setCookie('themePreference', selectedTheme)
}

function toggleLiveTextMode() {
    setCookie('liveTextMode', this.checked)
    liveTextMode = this.checked
}

function toggleUseOpenAI() {
    setCookie('useOpenAI', this.checked)
    useOpenAI = this.checked
    if (useOpenAI) {
        document.getElementById('promptNames')?.closest('.settings-menu-group')?.classList.add('active')
        document.getElementById('toggleLiveText')?.closest('.settings-menu-group')?.classList.remove('active')
    } else {
        document.getElementById('promptNames')?.closest('.settings-menu-group')?.classList.remove('active')
        document.getElementById('toggleLiveText')?.closest('.settings-menu-group')?.classList.add('active')
        setupSpeechDicatation()
    }
}

function handlePromptNamesKeyDown(e) {
    const validChars = /^[a-zA-Z!?,\s]*$/ // Add more invalid characters as needed
    if (e.key === 'Enter') {
        e.target.blur()
        return true
    }

     // Automatically allow control keys (backspace, delete, arrow keys, etc.)
    if (e.key.length > 1) {
        return true
    }

    const value = e.target.value + e.key
    if (!validChars.test(value)) {
        e.preventDefault() // Invalid characters detected. Prevent keystroke.
        return false
    }
    return true
}

function updatePromptNames(value) {
    try {
        const names = value.split(', ')
        promptNames = names
        setCookie('promptNamesArray', JSON.stringify(names))
    } catch (err) {
        console.error('Prompt names are incorrectly formatted.')
    }
}

function updateAppScale(value) {
    const newCssVal = (parseFloat(value) * 8) + 'px'
    document.documentElement.style.setProperty('--adjustable-app-scale', newCssVal)
    setCookie('appScalePreference', parseFloat(value))
}

function increaseAppScale() {
    var appScaleInput = document.getElementById('appScalePref')
    const currentValue = parseFloat(appScaleInput.value)
    if (currentValue < 4) {
        appScaleInput.value = parseFloat(appScaleInput.value) + 0.25
        appScaleInput.dispatchEvent(new Event('change'))
    }
}

function decreaseAppScale() {
    var appScaleInput = document.getElementById('appScalePref')
    const currentValue = parseFloat(appScaleInput.value)
    if (currentValue > 0.25) {
        appScaleInput.value = currentValue - 0.25
        appScaleInput.dispatchEvent(new Event('change'))
    }
}

function updateBrightnessLevel(value) {
    const newCssVal = parseFloat(value)
    document.documentElement.style.setProperty('--brightness-level', newCssVal)
    setCookie('brightnessPreference', parseFloat(value))
}

function increaseBrightness() {
    var brightnessInput = document.getElementById('brightnessPref')
    const currentValue = parseFloat(brightnessInput.value)
    if (currentValue < 3) {
        brightnessInput.value = parseFloat(brightnessInput.value) + 0.25
        brightnessInput.dispatchEvent(new Event('change'))
    }
}

function decreaseBrightness() {
    var brightnessInput = document.getElementById('brightnessPref')
    const currentValue = parseFloat(brightnessInput.value)
    if (currentValue > 0.25) {
        brightnessInput.value = currentValue - 0.25
        brightnessInput.dispatchEvent(new Event('change'))
    }
}

function updateFontSize(value) {
    const newCssVal = parseFloat(value) + 'rem'
    document.documentElement.style.setProperty('--adjustable-font-size', newCssVal)
    setCookie('fontSizePreference', parseFloat(value))
}

function increaseFontSize() {
    var fontSizeInput = document.getElementById('fontSizePref')
    const currentValue = parseFloat(fontSizeInput.value)
    if (currentValue < 4) {
        fontSizeInput.value = parseFloat(fontSizeInput.value) + 0.25
        fontSizeInput.dispatchEvent(new Event('change'))
    }
}

function decreaseFontSize() {
    var fontSizeInput = document.getElementById('fontSizePref')
    const currentValue = parseFloat(fontSizeInput.value)
    if (currentValue > 0.5) {
        fontSizeInput.value = currentValue - 0.25
        fontSizeInput.dispatchEvent(new Event('change'))
    }
}

function updateFont(value) {
    // Remove extisting font class from body
    Array.from(document.body.classList).forEach(className => className.startsWith('font-') && document.body.classList.remove(className))
    // Add new font class to body
    document.body.classList.add(value)
    // Remove extisting font class from lorem ipsum display
    Array.from(document.querySelector('.lorem-ipsum').classList).forEach(className => className.startsWith('font-') && document.querySelector('.lorem-ipsum').classList.remove(className))
    // Add new font class to lorem ipsum display
    document.querySelector('.lorem-ipsum').classList.add(value)
    setCookie('fontPreference', value)
}

function togglefontAllCaps() {
    setCookie('fontAllCaps', this.checked)
    fontAllCaps = this.checked
    document.documentElement.style.setProperty('--adjustable-text-transform', fontAllCaps ? 'uppercase' : 'capitalize')
}

function updateChalkiness(value) {
    const newCssVal = 1 - parseFloat(value)
    document.documentElement.style.setProperty('--adjustable-chalkiness', newCssVal)
    setCookie('chalkinessPreference', parseFloat(value))
}

function increaseChalkiness() {
    var chalkinessInput = document.getElementById('chalkinessPref')
    const currentValue = parseFloat(chalkinessInput.value)
    if (currentValue < 1) {
        chalkinessInput.value = parseFloat(chalkinessInput.value) + 0.25
        chalkinessInput.dispatchEvent(new Event('change'))
    }
}

function decreaseChalkiness() {
    var chalkinessInput = document.getElementById('chalkinessPref')
    const currentValue = parseFloat(chalkinessInput.value)
    if (currentValue > 0) {
        chalkinessInput.value = currentValue - 0.25
        chalkinessInput.dispatchEvent(new Event('change'))
    }
}

function updateSlideshowContext(selectedSlideshow) {
    if (selectedSlideshow) {
        // Update global vars
        currentSlideshowID = selectedSlideshow
        slideshow = slideshowConfig[currentSlideshowID] || null
        document.querySelector('body').classList.add('slideshow')        
        if (selectedSlideshow) {
            document.getElementById('selectSlideshow')?.closest('.settings-menu-group')?.classList.add('active')
            populateSelectWithSlideNumbers()
        }
        // Load font if necessary
        if (slideshow?.exoticfont) {
            let fontUrl;
            let fontName;
            switch (slideshow.exoticfont.toLowerCase()) {
                case 'aurebesh':
                    fontUrl = 'https://fonts.cdnfonts.com/css/aurebesh';
                    fontName = 'Aurebesh';
                    break;
                case 'elvish':
                    fontUrl = 'https://fonts.cdnfonts.com/css/tengwar-quenya';
                    fontName = 'Tengwar Quenya';
                    break;
                case 'dwarvish':
                    fontUrl = 'https://fonts.cdnfonts.com/css/khuzdulerebor';
                    fontName = 'KhuzdulErebor';
                    break;
            }

            if (fontUrl) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fontUrl;
                document.head.appendChild(link);

                // Check if an existing <style> tag for the exotic font is present
                let styleTag = document.getElementById('exotic-font-style');
                if (!styleTag) {
                    // Create a new <style> tag if it does not exist
                    styleTag = document.createElement('style');
                    styleTag.id = 'exotic-font-style';
                    document.head.appendChild(styleTag);
                }

                // Update the <style> tag with the @font-face and CSS variable definition
                styleTag.innerHTML = `
                    :root { --exotic-font: '${fontName}'; }
                `;
            }
        }
    } else {
        document.querySelector('body').classList.remove('slideshow')
        document.getElementById('selectSlideshow')?.closest('.settings-menu-group')?.classList.remove('active')
    }
    setCookie('slideshowPreference', selectedSlideshow)
}

async function updateCombatPlaylist(playlistID) {
    setCookie('combatPlaylist', playlistID);
    document.querySelectorAll('#selectCombatPlaylist, #selectAudioPlayerPlaylist').forEach(sel => sel.value = playlistID)
    if (!playlistID) {
        document.getElementById('howlerPlayer').classList.remove('active')
    } else {
        document.getElementById('howlerPlayer').classList.add('active')
    }
    if (playlistID) {
        await updateHowlPlaylist(playlistID)
        combatPlaylist = playlistID
        document.querySelector('body').classList.add('music')
    } else {
        await Audio.stop()
        document.querySelector('body').classList.remove('music')
    }
}

function populateSelectWithFonts() {
    const fonts = [
        'Architects Daughter', 'Babylonica', 'Baron Kuffner', 'Bilbo Swash Caps', 'Broken Crush', 'Caveat', 'Comforter', 'Condiment',
        'Creatinin-pro', 'Dawning of a New Day', 'Dracufrankenwolfbb', 'East Sea Dokdo', 'eordeoghlakat', 'Fibyngerowa', 'Fuggles',
        'Grape Nuts', 'Grenhil', 'Homemade Apple', 'Ickyticketmono', 'Inspiration', 'Inverted Interrobang', 'Julee', 'Just Me Again Down Here',
        'Kgbythegraceofgod', 'Kolker Brush', 'La Belle Aurore', 'Lincons', 'Liu Jian Mao Cao', 'Long Cang', 'Lugosi', 'Malinsha Rough', 'Mystic Forest',
        'Nanum Brush Script', 'Nothing You Could Do', 'Oooh Baby', 'Over the Rainbow', 'Permanent Marker', 'Qwitcher Grypen', 'Raventame',
        'Reenie Beanie', 'Rock Salt', 'Ruthie', 'Sassy Frass', 'Sedgwick Ave', 'Shalimar', 'Smooch', 'Splash', 'Square Peg', 'Swanky and Moo Moo',
        'Unionagrochem', 'Vtks Distress', 'Vujahday Script', 'Waiting for the Sunrise', 'Walter Turncoat', 'Whisper'
    ]

    const selectElement = document.querySelector('#selectFont')
    fonts.forEach(font => {
        const option = document.createElement('option')
        const convertedFontName = 'font-' + font.toLowerCase().replace(/\s+/g, '-') // Convert font name to classname format
        option.className = convertedFontName
        option.value = convertedFontName
        if (convertedFontName == chosenFont) {
            option.selected = true
        }
        option.textContent = font
        selectElement?.appendChild(option)
    })
}

function populateSelectWithThemes() {
    const themes = [
        {
            name: 'D&D',
            css: 'themes/dnd/dnd-theme.css',
            font: 'font-eordeoghlakat',
        },
        {
            name: 'Kenobi',
            css: 'themes/kenobi/kenobi-theme.css',
            font: 'font-aurebesh',
        },
        {
            name: 'Empire',
            css: 'themes/empire/empire-theme.css',
            font: 'font-aurebesh',
        },
        // 'Star Wars Imperial Deck', 'Star Wars Destroyer View', 'Star Wars Computer Terminal', 'Star Wars Death Star', 'Star Wars Darth vs Luke', 'Star Wars Darth vs Asoka', 'Star Wars Rey vs Kylo', 'Star Wars Rise of Skywalker', 'Star Wars Evil Rey', 'Star Wars Retro'
    ]

    const selectElement = document.querySelector('#selectTheme')
    themes.forEach(theme => {
        const option = document.createElement('option')
        // Convert theme data to option value and data attributes
        option.value = theme.name
        if (option.value == chosenTheme) {
            option.selected = true
        }
        option.textContent = theme.name
        option.dataset.css = theme.css
        option.dataset.font = theme.font
        selectElement.appendChild(option)
    })
}

function loadCSS(url) {
    // Create a new link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;

    // remove existing theme css
    removeThemeStyles()

    // Append the link element to the head of the document
    document.head.appendChild(link);
}

function populateSelectWithSlideshows() {
    if (slideshowConfig) {
        const selectElement = document.querySelector('#selectSlideshow')
        selectElement.innerHTML = '' // empty it out first

        // Add initial <option value="">None</option>
        const initialOption = document.createElement('option');
        initialOption.value = '';
        initialOption.textContent = 'None';
        selectElement.appendChild(initialOption);
        
        for (const [id, config] of Object.entries(slideshowConfig)) {
            const option = document.createElement('option')
            // Convert theme data to option value and data attributes
            option.value = id
            if (option.value == currentSlideshowID) {
                option.selected = true
            }
            option.textContent = config.name
            selectElement.appendChild(option)
        }
    }
}

function populateSelectWithSlideNumbers() {
    if (slideshow) { // check whether there is indeed a slideshow selected
        const selectElement = document.querySelector('#slideshowNextSlide')
        selectElement.innerHTML = '';

        slideshow.scenes?.forEach((scn, idx) => {
            const option = document.createElement('option')
            // Convert theme data to option value and data attributes
            option.value = idx + 1
            option.textContent = idx + 1
            selectElement.appendChild(option)
        })
    }
}

function populateSelectWithPlaylists() {
    if (playlistJSON) {
        const selectElements = document.querySelectorAll('#selectCombatPlaylist, #selectAudioPlayerPlaylist')
        selectElements.forEach(selectElement => {
            selectElement.innerHTML = '' // empty it out first

            // Add initial <option value="">None</option>
            const initialOption = document.createElement('option')
            initialOption.value = ''
            initialOption.textContent = 'None'
            selectElement.appendChild(initialOption)
            
            for (const [id] of Object.entries(playlistJSON)) {
                const option = document.createElement('option')
                // Convert playlist data to option value and data attributes
                option.value = id
                if (option.value == combatPlaylist) {
                    option.selected = true
                }
                const name = id.replace(/^dnd_/, 'D&D ').replace(/^sw_/, 'Starwars ').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
                option.textContent = name
                selectElement.appendChild(option)
            }
        })
    }
}

// Function to remove all CSS files starting with /themes/
function removeThemeStyles() {
    // Get all link elements in the document
    const links = document.getElementsByTagName('link');

    // Iterate through the link elements
    for (let i = links.length - 1; i >= 0; i--) {
        const link = links[i];

        // Check if the link element is a stylesheet and if its href starts with /themes/
        if (link.rel === 'stylesheet' && link.href.startsWith(window.location.origin + '/themes/')) {
            // Remove the link element from the document
            link.parentNode.removeChild(link);
        }
    }
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}



/**
 * Turn Management
 */

function startTurnCounter() {
    highlightCurrentTurn(true)
    beginCombat()
    updateTally(currentRound)
    setCookie('round', currentRound)
    setCookie('turnStarted', 'true')
}

function beginCombat() {
    document.body.classList.add('active-turn')
    // set the state of the Previous buttton based on rehydrated round/turn state
    document.getElementById('prevTurn').disabled = (currentRound < 2 && currentTurn < 1)
    document.getElementById('nextTurn').disabled = false
    // document.getElementById('startButton').disabled = true
}

function endCombat() {
    document.body.classList.remove('active-turn')
    document.getElementById('prevTurn').disabled = true
    document.getElementById('nextTurn').disabled = true
    // document.getElementById('startButton').disabled = false
}

function advanceTurn() {
    let skippedTurns = 0; // Counter to ensure we don't end up in an infinite loop
    do {
        currentTurn = (currentTurn + 1) % players.length

        // Start a new round if it wraps back to the first player
        if (currentTurn == 0) {
            currentRound++
            updateTally(currentRound)
            setCookie('round', currentRound)
        }

        // Increment the skipped turns counter
        skippedTurns++
    } while (players[currentTurn].dead && skippedTurns < players.length); // Continue if the player is dead, but not if we've looped through all players

    // Handle the situation where all players are dead (if necessary)
    if (skippedTurns >= players.length) {
        // Handle the scenario where all players are dead. E.g., display a message or take some other action.
        console.error("All players are dead.")
        return
    }

    highlightCurrentTurn(true)

    document.getElementById('prevTurn').disabled = false
}

function goBackOneTurn() {
    let skippedTurns = 0; // Counter to ensure we don't end up in an infinite loop

    do {
        currentTurn--

        // If it wraps back to the last player
        if (currentTurn == -1) {
            currentTurn = players.length - 1
            currentRound--

            // Reset if we went back to "round 0"
            if (currentRound == 0) {
                currentRound = 1
                currentTurn = 0
                turnStarted = false
                setCookie('turnStarted', 'false')
            }

            updateTally(currentRound)
            setCookie('round', currentRound)
        }

        // Increment the skipped turns counter
        skippedTurns++
    } while (players[currentTurn].dead && skippedTurns < players.length); // Continue if the player is dead, but not if we've looped through all players

    // Handle the situation where all players are dead (if necessary)
    if (skippedTurns >= players.length) {
        // Handle the scenario where all players are dead. E.g., display a message or take some other action.
        console.error("All players are dead.")
        return
    }

    highlightCurrentTurn(true)
    setCookie('turn', currentTurn)

    if (currentRound == 1 && currentTurn == 0) {
        document.getElementById('prevTurn').disabled = true
    }
}

// Update the round counter tally marks
function updateTally(roundNumber) {
    const roundCounter = document.getElementById('roundCounter')
    let existingTallies = roundCounter.querySelectorAll('.round-tally')

    let requiredTallies = Math.ceil(roundNumber / 5)
    let difference = requiredTallies - existingTallies.length

    // In round 1, use the label "Round ", then remove it for round 2+
    // roundCounter.querySelector('.round-label').textContent = (roundNumber == 1 ? 'Round ' : '')
    // Add required tally elements if they're less than needed
    for (let i = 0; i < difference; i++) {
        const element = document.createElement('div')
        element.classList.add('round-tally')
        roundCounter.appendChild(element)
    }

    // Remove extra tally elements if they're more than needed
    for (let i = 0; i < -difference; i++) {
        roundCounter.removeChild(existingTallies[existingTallies.length - 1])
    }

    // Update the data-marks attribute for all tally elements
    existingTallies = roundCounter.querySelectorAll('.round-tally')  // fetch the tallies again after potential changes
    for (let i = 0; i < existingTallies.length; i++) {
        const marks = (i === existingTallies.length - 1) ? (roundNumber % 5 === 0 ? 5 : roundNumber % 5) : 5
        existingTallies[i].setAttribute('data-marks', marks.toString())
    }
}

function highlightCurrentTurn(doScroll) {
    const listItems = document.querySelectorAll('#entries li')
    listItems.forEach(li => li.classList.remove('highlighted'))
    if (listItems[currentTurn]) {
        listItems[currentTurn].classList.add('highlighted')
        if (doScroll) {
            // Scroll the highlighted item into view
            listItems[currentTurn].scrollIntoView({
                behavior: 'smooth', // Optional: Defines the transition animation.
                block: 'center',    // Vertical alignment.
                inline: 'nearest'   // Horizontal alignment.
            })
        }
    }
}

function clearAll() {
    if (!confirm('Clear Everything?')) return
    players = []
    currentTurn = 0
    currentRound = 1
    renderPlayers()
    final_recognized_transcript = ''
    allTranscripts = []
    endCombat()
    document.body.classList.remove('players-listed')
    document.getElementById('speechInput').value = ''
    document.querySelectorAll('.round-tally').forEach(el => el.remove())

    // Clearing cookies
    setCookie('players','')
    setCookie('turn','')
    setCookie('round','')
    setCookie('turnStarted','')
}

/**
 * Player Entries Management
 */

function parseAndAddEntries(convertedInput) {
    // match full "character @ roll" entries. Ex: "goblin #2 @ 15"
    const regex = /([a-zA-Z#0-9\._'-\s]+?)\s*?@ (-?\d+)/g
    let matches

    players = []
    while ((matches = regex.exec(convertedInput)) !== null) {
        let name = matches[1].trim()
        let orderString = matches[2]

        let order
        if (orderString && isNaN(orderString)) {
            order = numberMapSingleDigit[orderString.toLowerCase()] || numberMapDoubleDigit[orderString.toLowerCase()] || NaN
        } else if (orderString && !isNaN(orderString)) {
            order = parseInt(orderString, 10)
        } else {
            order = NaN  // default to NaN if orderString is not defined
        }

        // Remove leading "and ", then capitalize the names
        name = name.replace(/^and /, '').split(" ").map(capitalize).join(" ")
        players.push({ name: name, order: order, badge: '' })
    }

    // Sorting and rendering the players
    players.sort((a, b) => b.order - a.order)
    allTranscripts = [generatedPlayersTranscript(players)]
    addPlayersAndGo()
}

// Trim incomplete 'player @ order" pairs
function trimIncompletePattern(str) {
    // Regex that matches everything up to the last occurrence of "@ [number]"
    const regex = /(.+@ -?\d+)(?:\s|$).*/;
  
    // Execute the regex on the string
    const match = str.match(regex);
  
    // If a match is found, return the matched part that leads up to and includes the last "@ [number]"
    if (match) {
      return match[1];
    }
  
    // If no match is found or regex doesn't apply, return the original string
    return str;
}

function parseInput(input) {
    console.debug('Before processing: ' + input)

    // Replace punctuation with spaces
    input = input.replace(/[.,!?;:()]/g, ' ')
    // Trim all spaces to single space
    input = input.replace(/\s+/g, ' ').trim()
    // Make lowercase
    input = input.toLowerCase()
    // Add a space to the end
    input = input + ' '
    
    input = makeSpellingCorrections(input)

    // Replace the roll/role variations with the symbol "@"
    input = input.replace(new RegExp(` (${aliasesForRolled.join('|')})( a| an| and| of| on| [aeu]h+|)? `, 'g'), ' @ ')

    input = convertNumberWordsToNumerals(input)

    // Guess at where roll "@" symbols should be added in: find adjacent numbers and insert @ between them (if the word ≈"rolled" WAS NOT said). Ex: "3 11" to "3 @ 11"
    input = input.replace(/\b(\d\d?) (-?\d\d?)/g, (match, p1, p2) => `${p1} @ ${p2}`)
    // Guess at where roll "@" symbols should be added in: find standalone numbers and insert @ before them (if the word ≈"rolled" WAS NOT said). also handles curse words =) Ex: "john 4" to "john @ 4"
    input = input.replace(/([a-z\*]) (-?\d\d? (?=[a-z\*]|$))/g, (match, p1, p2) => `${p1} @ ${p2}`)

    return input
}

function replaceUniqueGroupNumberWords(input) {
    const uniqueGroupNumberWords = {
        'tutu':'2 2',
        'want to':'1 2',
        'want for':'1 4'
    }

    // Replace unique group-number words
    let result = input;
    for (const [word, number] of Object.entries(uniqueGroupNumberWords)) {
        let numberWordpattern = new RegExp(`\\b(${word})+\\b`, 'g')
        result = result.replace(numberWordpattern, `${number}`)
    }
    return result
}

function makeSpellingCorrections(input) {
    let previousInputValue = input
    // Replace stored spelling/word corrections
    for (const [heard, correctWord] of Object.entries(aliasMap)) {
        let aliasWordpattern = new RegExp(`\\b${heard}\\b`, 'g')
        input = input.replace(aliasWordpattern, `${correctWord}`)
    }
    if (previousInputValue !== input) {
        console.debug('Spelling corrections...\nBEFORE: ' + previousInputValue + '\nAFTER: ' + input)
    }
    return input
}

function convertNumberWordsToNumerals(input) {
    let previousInputValue = input

    // Replace number words
    for (const [word, number] of Object.entries(numberMapSingleDigit).concat(Object.entries(numberMapDoubleDigit))) {
        let numberWordpattern = new RegExp(`\\b(${word})+\\b`, 'g')
        input = input.replace(numberWordpattern, `${number}`)
    }
    // Split up WORD-## or WORD##. Ex: "demon-12" or "demon12" to "demon 12"
    input = input.replace(/([a-z\*])-?(\d+)/g, (match, p1, p2) => `${p1} ${p2}`)
    // Split up #-# or #/# or #:#. Ex: "3-4" or "3/4" or "3:4" becomes "3 4"
    input = input.replace(/(\d+)[-/:](\d+)/g, (match, p1, p2) => `${p1} ${p2}`)
    // Handle negative numbers. Ex: "negative 4" to "-4"
    input = input.replace(/\b[Nn]egative (\d+)/g, (match, p1) => `-${p1}`)
    // Remove the word "number". Ex: "goblin number 3" becomes "goblin 3"
    input = input.replace(/\b[Nn]umber (\d)/g, (match, p1) => `${p1}`)
    // Split 4-digit numbers into two 2-digit groups,. Ex: "1110" to "11 10"
    input = input.replace(/\b(\d\d)(\d\d)/g, (match, p1, p2) => `${p1} ${p2}`)
    // Split 3-digit numbers into two groups, preferring single digit in group 1. Ex: "311" to "3 11"
    input = input.replace(/\b(\d)(\d\d)/g, (match, p1, p2) => `${p1} ${p2}`)

    if (previousInputValue !== input) {
        console.debug('Number word corrections...\nBefore: ' + previousInputValue + '\nAfter: ' + input)
    }
    return input
}

function handleManualInputSubmit(e) {
    if (e.type === 'submit') {
        e.preventDefault()
    }
    const speechInput = e.target.querySelector('input')
    allTranscripts.push(speechInput.value)
    const joinedInput = allTranscripts.join(' ')
    const convertedInput = parseInput(joinedInput)
    input = trimIncompletePattern(input)
    console.info(`parsed results: ${input}`)
    parseAndAddEntries(convertedInput)
    speechInput.value = ''
}

function generatedPlayersTranscript(playersObj) {
    return playersObj.map(player => `${player.name} @ ${player.order}`).join(', ') + ', '
}

function addPlayer() {
    players.push({ name: 'NAME', order: 0, badge: '' })
    addPlayersAndGo()
    const lastMatchingInput = Array.from(document.querySelectorAll('input.player-name')).reverse().find(input => input.value === 'NAME');
    lastMatchingInput.focus()
}

function addPlayersAndGo() {    
    setCookie('players', JSON.stringify(players))
    if (players.length) {
        renderPlayers()
        startTurnCounter()
    }
}

function renderPlayers() {
    const list = document.getElementById('entries')
    list.innerHTML = ''

    players.forEach(player => {
        const li = document.createElement('li')
        li.appendChild(createPlayerRow('player-order', player))
        li.appendChild(createPlayerRow('player-name', player))
        li.appendChild(createPlayerRow('player-badge', player))
        list.appendChild(li)
    })

    document.body.classList.add('players-listed')
    highlightCurrentTurn()

    function createPlayerRow(type, player) {
        switch (type) {
            case 'player-order':
                return createInput(type, player.order, player)
            case 'player-name':
                if (player.dead) {
                    return createDeadPlayerNameElement(type, player.name)
                }
                return createInput(type, player.name, player)
            case 'player-badge':
                return createBadgeIcon(type, player)
        }
    }

    function createInput(className, value, player) {
        const el = document.createElement('input')
        el.className = className
        el.value = value

        if (className === 'player-order') {
            el.setAttribute("pattern", "[\\-\\d]*")
            el.setAttribute("inputmode", "decimal")
        } else if (className === 'player-name') {
            el.setAttribute("autocapitalize", "words")
            if (player.bloodied) el.classList.add('bloodied')
        }

        el.addEventListener('focus', handleFocus.bind(null, player, el))
        el.addEventListener('keydown', handleEdit.bind(null, player, el))
        el.addEventListener('focusout', handleEdit.bind(null, player, el))

        return el
    }

    function createDeadPlayerNameElement(type, name) {
        const el = document.createElement('div')
        el.classList = `${type} strike-thru`
        el.textContent = name
        return el
    }

    function createBadgeIcon(className, player) {
        const el = document.createElement('div')
        el.classList = className
        el.setAttribute('tabindex', '0')

        const { icon, action } = getBadgeIconData(player)

        el.innerHTML = `<i class="${icon}">`
        el.addEventListener('click', () => {
            action(player)
            postEditCleanup(true)
        })

        return el
    }

    function getBadgeIconData(player) {
        if (player.dead) {
            return {
                icon: 'fas fa-skull',
                action: (player) => {
                    player.dead = false
                    player.bloodied = false
                }
            }
        } else if (player.bloodied) {
            return {
                icon: 'fas fa-heart-crack',
                action: (player) => {
                    player.dead = true
                    player.bloodied = false
                }
            }
        } else {
            return {
                icon: 'fas fa-heart',
                action: (player) => {
                    player.dead = false
                    player.bloodied = true
                }
            }
        }
    }

    function handleFocus(player, input, e) {
        e.target.select();
    }

    function handleEdit(player, input, e) {
        if (e.type === 'keydown') {
            if (input.className == 'player-order' && /[\.-]/.test(e.key)) {
                e.preventDefault()
                if (/-/.test(e.target.value)) {
                    // negative sign already exists in the input field. prevent another.
                    e.target.value = e.target.value.replace(/-/g,'')
                } else {
                    e.target.value = `-${e.target.value}`
                }
                return // Decimal key or minus key was pressed -- treat it as a minus sign toggle
            }
            if (input.className == 'player-order' && e.key.length === 1 && /\D/.test(e.key)) {
                e.preventDefault() // Non-numeric key was prssed on player order field
            }
            if (e.key !== 'Enter') {
                return // Normal characters were input. Let em ride.
            }
            if (input.className == 'player-name') {
                input.previousElementSibling.focus() // ENTER was hit. Focus on player order now.
            }
        }
        
        const newValue = (input.className === 'player-order') ? parseInt(input.value, 10) : input.value
        const doRerender = input.className === 'player-order' || (input.className === 'player-name' && newValue == '')
        
        switch (input.className) {
            case 'player-order':
                player.order = newValue
                break
            case 'player-name':
                if (newValue) {
                    player.name = newValue
                } else {
                    player.deleteme = true
                }
                break
            case 'player-badge':
                player.badge = newValue
                break
        }

        // if (e.relatedTarget && e.relatedTarget.tagName === 'INPUT') e.relatedTarget.select()
        postEditCleanup(doRerender)
    }

    function postEditCleanup(doRerender) {
        players = players.filter(p => !p.deleteme)
        if (doRerender) players.sort((a, b) => b.order - a.order)

        allTranscripts = [generatedPlayersTranscript(players)]
        if (doRerender) renderPlayers()
        setCookie('players', JSON.stringify(players))
        clearQueryString()
    }
}

/**
 * Slideshow Management
 */

async function fetchJSON(url) {
    const response = await fetch(url)
    return response.json()
}

function updateNextSlideToShow (newVal) {
    document.getElementById('sceneBtn').href = `#${newVal}`
    document.getElementById('sceneBtn').dataset.slide = newVal
    setCookie('slideshowNextSlidePreference', newVal)
}

function handleSlideControlClick(e) {
    if (!e.target.closest('.prev-slide')) {
        const nextHash = getNextHash()
        const newSceneBtnHash = nextHash !== '' ? nextHash : '1'
        updateNextSlideToShow(newSceneBtnHash)
    }
}

function getCurrentHashNumber() {
    const currentWindowHash = window.location.hash.substring(1)
    const currentNumber = parseInt(currentWindowHash) || 0
    return currentNumber
}

function getNextHash(hashVal) {
    const hashNum = hashVal ? parseInt(hashVal) : null
    const currentNumber = getCurrentHashNumber()
    const nextNumber = (typeof hashNum === 'number' ? hashNum : currentNumber) + 1
    
    if (slideshow?.scenes?.[nextNumber - 1]) {
        return `${nextNumber}`
    } else {
        return '' // return to initiative tracker view
    }
}

function getPrevHash(hashVal) {
    const hashNum = hashVal ? parseInt(hashVal) : null
    const currentNumber = getCurrentHashNumber()
    const nextNumber = (typeof hashNum === 'number' ? hashNum : currentNumber) - 1
    
    if (slideshow?.scenes?.[nextNumber - 1]) {
        return `${nextNumber}`
    } else {
        return '' // return to initiative tracker view
    }
}

let timeOfLastSlideAdvance = 0;
/**
 * Loads the specified screen content into the slideshow canvas. If the URL points to an image, 
 * it loads the image directly. Otherwise, it fetches HTML content from the URL and populates 
 * the slideshow canvas with it. Manages fade transitions between screens.
 *
 * @param {string} url - The URL of the content to load. Can be an image URL or an HTML URL.
 * @returns {Promise<void>} A promise that resolves when the content has been loaded and the fade transitions have been set up.
 */
async function loadScreen(url, pageObj) {
    const slideshowPage = document.getElementById('canvas-slideshow')
    const initiativePage = document.getElementById('canvas-initiative')
    const activeCanvas = document.querySelector('.canvas.active') || initiativePage
    const sceneIndex = slideshow?.scenes?.findIndex(scene => scene.url === url);
    const sceneHash = sceneIndex !== -1 ? sceneIndex + 1 : null;
        
    if (!activeCanvas) {
        console.warn('no active canvas!')
        return
    }
    
    const isQuickClick = (timeOfLastSlideAdvance > 0 && performance.now() - timeOfLastSlideAdvance < 1000) || (activeCanvas.matches('.--animating-in', '--animating-out'))
    timeOfLastSlideAdvance = performance.now()
    const duration = isQuickClick ? 100 : 1000 // Make the transition instant if the user is quickly clicking thru the slides

    // If we just need to return to the initiative tracker, fade active canvas out and fade initiative canvas in and be done.
    if (isInitiativeFetch(url)) {
        return new Promise(resolve => {
            fadeOut(activeCanvas, duration, () => {
                fadeIn(initiativePage, duration, resolve)
            })
        })
    }

    let html = '';

    // Determine if the URL is for an image
    const isImage = !url && !!pageObj && pageObj.image && ['.webp', '.jpg', '.jpeg', '.png'].some(ext => pageObj.image.toLowerCase().endsWith(ext))

    if (isImage) {
        // Construct HTML for the next slide, if it was just an image with optional caption texts
        html = `
            <div class="slideshow-content">
                <div class="slideshow-wrapper">
                    <figure class="slideshow-image">
                        <img src="${pageObj.image}" alt="Slide Image"/>
                        ${pageObj.caption ? `
                        ${pageObj.show_exotic_font ? `
                        <figcaption class="illegible-text">
                            <p>${pageObj.caption}
                                ${pageObj.subcap ? `<br/><sub>${pageObj.subcap}</sub>` : ''}
                            </p>
                        </figcaption>
                        ` : ''}
                        <figcaption class="legible-text">
                            <p>${pageObj.caption}
                                ${pageObj.subcap ? `<br/><sub>${pageObj.subcap}</sub>` : ''}
                            </p>
                        </figcaption>
                        ` : ''}
                    </figure>
                </div>
            </div>
        `;
    } else {
        // Or, fetch the HTML content for the next slide
        try {
            const response = await fetch(url);
            html = await response.text();
            console.debug('fetched.');
        } catch (err) {
            console.warn('Error loading page:', err);
            return;
        }
    }

    // Load up the next slide, and fade it in.
    return new Promise(resolve => {
        fadeOut(activeCanvas, duration,  () => {
            // Populate div, but it's still hidden (opacity: 0) at this point.
            slideshowPage.innerHTML = html

            // Populate with slideshow control buttons (Click right side of screen to advance to next slide, middle go start initiative, left to go back.)
            const slideControlButtons = ['prev-slide', 'return-to-initiative', 'next-slide']
            slideControlButtons.forEach(className => {
                const link = document.createElement('a')
                link.setAttribute('role', 'button')
                link.className = `slide-control ${className}`
                // Set hrefs using getNextHash and getPrevHash
                if (className === 'next-slide') link.href = `#${getNextHash(sceneHash)}`
                if (className === 'prev-slide') link.href = `#${getPrevHash(sceneHash)}`
                if (className === 'return-to-initiative') link.href = '#'
                slideshowPage.querySelector('.slideshow-content').appendChild(link)
            })
            fadeIn(slideshowPage, duration)
        })
        resolve() // Resolve immediately after fetch (having also set up the fades to fire)
    })
}

function isInitiativeFetch(url) {
    let goBackToInitiative = false
    // test whether the URL points to root (i.e. points back to the initiative tracker)
    goBackToInitiative = (/^\/$|^\/[#\?]/.test(url))
    goBackToInitiative = goBackToInitiative || (/^INITIATIVE/.test(url))
    return goBackToInitiative
}

function stopAnimation(el) {
    // Cancel requestAnimationFrame
    if (el.animationFrameId) {
        cancelAnimationFrame(el.animationFrameId)
        delete el.animationFrameId
    }

    // Remove animation classes and reset styles
    el.classList.remove('--animating-in', '--animating-out')
    el.style.removeProperty('opacity')
}

// ** FADE IN FUNCTION FROM https://dev.to/bmsvieira/vanilla-js-fadein-out-2a6o **
function fadeIn(el, duration = 1000, callback = () => {}) {
    // Stop any ongoing animation
    stopAnimation(el)

    el.classList.add('active')
    el.style.opacity = 0
    // Ensure it's not display:none
    el.classList.remove('faded-out', 'will-fade-in')
    // Tag it as "animating" so we can detect in-progress animations, in case we need to stop mid-stream
    el.classList.add('--animating-in', 'active')

    const start = performance.now()

    function fade(time) {
        // Calculate the elapsed time
        const elapsed = time - start
        // Calculate the opacity value based on elapsed time
        el.style.opacity = Math.min(elapsed / duration, 1)

        if (elapsed < duration) {
            el.animationFrameId = requestAnimationFrame(fade)
        } else {
            // Animation complete
            console.debug('faded in!')
            stopAnimation(el)
            el.classList.add('faded-in')
            if (typeof callback === 'function') callback()
        }
    }

    console.debug('beginning fade in...')
    el.animationFrameId = requestAnimationFrame(fade)
}

// ** FADE OUT FUNCTION FROM https://dev.to/bmsvieira/vanilla-js-fadein-out-2a6o **
function fadeOut(el, duration = 1000, callback = () => {}) {
    // Stop any ongoing animation
    stopAnimation(el)

    el.style.opacity = 1
    el.classList.remove('faded-in', 'will-fade-in')
    // Tag it as "animating" so we can detect in-progress animations, in case we need to stop mid-stream
    el.classList.add('--animating-out')

    const start = performance.now()

    function fade(time) {
        // Calculate the elapsed time
        const elapsed = time - start
        // Calculate the opacity value based on elapsed time
        el.style.opacity = Math.max(1 - (elapsed / duration), 0)

        if (elapsed < duration) {
            el.animationFrameId = requestAnimationFrame(fade)
        } else {
            // Animation complete
            console.debug('faded out')
            stopAnimation(el)
            el.classList.remove('active')
            el.classList.add('faded-out')
            if (typeof callback === 'function') callback()
        }
    }

    console.debug('beginning fade out...')
    el.animationFrameId = requestAnimationFrame(fade)
}

/**
 * Cookie Management
 */

function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/`
}

function getCookie(name) {
    const value = "; " + document.cookie
    const parts = value.split("; " + name + "=")
    if (parts.length == 2) return parts.pop().split(";").shift()
}

function refreshPage() {
    location.reload()
}

/**
 * URL management
 */

async function updateSlideBasedOnHash(e) {
    console.log('UpdateSlideBasedOnHash executed')
    // Get the current hash value without the leading #
    const hash = window.location.hash.substring(1)
    // If no slide number hash or 0, go back to initiative tracker scene.
    if (/^$|^#0?$/.test(hash)) {
        loadScreen('INITIATIVE')
        console.log('Loading Initiative board.')
        if (Audio && e) {
            await Audio.fadeDown()
            await updateHowlPlaylist(combatPlaylist)
            if (combatMusicOn) {
                await Audio.playRandom()
            } else {
                await Audio.stop()
            }
        }
    } else {
        const sceneIndex = parseInt(hash) - 1
        const sceneToLaunch = slideshow?.scenes?.[sceneIndex] ?? null;
        const playlistToLoad = sceneToLaunch?.playlist ?? null
        if (sceneToLaunch) {
            if (sceneToLaunch.url) {
                loadScreen(sceneToLaunch.url);
            } else {
                loadScreen(null, {
                    image: sceneToLaunch.image,
                    caption: sceneToLaunch.caption,
                    subcap: sceneToLaunch.subcap,
                    show_exotic_font: !!slideshow?.exoticfont
                })
            }
            if (playlistToLoad) {
                await Audio.fadeDown()
                await updateHowlPlaylist(playlistToLoad)
                await Audio.playRandom()
            }
        } else {
            console.warn(`There is no slide #${hash} available for slideshow '${currentSlideshowID}'`);
        }
    }
}

// Update the link when the hash changes
window.onhashchange = updateSlideBasedOnHash

function clearQueryString() {
    // Replace the current query string with a blank one, so if the player refreshes, it doesn't wipe out any changes.
    const url = window.location.origin + window.location.pathname
    window.history.replaceState({}, document.title, url)
}

/**
 * Logging
 */
function outputLogsToSettingsPage() {
    let outputLogsToText = true // Toggle this to control logging behavior
    const eventLog = document.getElementById('eventlog')

    const originalConsole = {
        log: console.log,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        error: console.error
    }

    function appendToEventLog(type, args) {
        if (outputLogsToText && eventLog) {
            // eventLog.innerHTML += `[${type.toUpperCase()}]: ${args.join(' ')}<br>`
            eventLog.innerHTML += `${args.join(' ')}<br>`
        }
    }

    console.warn = function (...args) {
        originalConsole.warn.apply(console, args)
        appendToEventLog('warn', args)
    }

    console.info = function (...args) {
        originalConsole.info.apply(console, args)
        appendToEventLog('info', args)
    }

    console.error = function (...args) {
        originalConsole.error.apply(console, args)
        appendToEventLog('error', args)
    }

    // Expose the variable to the global scope if you need to toggle it outside of this function
    window.toggleLogOutput = function(val) {
        outputLogsToText = !!val
    }

    // If you want to stop logging to the <p> element, use:
    // toggleLogOutput(false)
}
