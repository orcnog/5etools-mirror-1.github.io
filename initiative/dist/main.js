/**
 * Declarations
*/
let micAllowed = false
let chosenFont
let chosenTheme
let liveTextMode = true
let players = []
let currentTurn = 0
let currentRound = 1
let recognition // SpeechRecognition object
let grammarList // SpeechGrammarList object
let final_transcript = ''
let allTranscripts = []
let aliasMap = {
    'brinley': 'brynlee',
    'zoe': 'zoey',
    'cal': 'kal',
    'casey': 'kacie',
    'claris': 'killaris',
    'colors': 'killaris',
    'broke off': 'brogoth',
    'odd': 'og',
    'share zoo': 'sharezu',
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
    outLogsToSettingsPage()
    rehydrateSettings()
    setupEventListeners()
    setupSpeechDicatation()
}


/**
 * Helper Functions
 */


function outLogsToSettingsPage() {
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

    // console.log = function (...args) {
    //     originalConsole.log.apply(console, args)
    //     appendToEventLog('log', args)
    // }

    console.warn = function (...args) {
        originalConsole.warn.apply(console, args)
        appendToEventLog('warn', args)
    }

    console.info = function (...args) {
        originalConsole.info.apply(console, args)
        appendToEventLog('info', args)
    }

    // console.debug = function (...args) {
    //     originalConsole.debug.apply(console, args)
    //     appendToEventLog('debug', args)
    // }

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

function rehydrateSettings() {
    /* Rehydrate the font config from cookie */
    chosenFont = getCookie('fontPreference') || 'font-eordeoghlakat'
    setCookie('fontPreference', chosenFont)
    document.body.classList.add(chosenFont)
    populateSelectWithFonts()
    document.querySelector('#selectFont').addEventListener('change', function (event) {
        const selectedClass = event.target.value
        // First, remove any existing font- class from the body
        Array.from(document.body.classList).forEach(className => className.startsWith('font-') && document.body.classList.remove(className))
        // Then, add the new selected class
        document.body.classList.add(selectedClass)
        // Remember the setting
        setCookie('fontPreference', selectedClass)
    })

    /* Rehydrate the chosen theme */
    chosenTheme = getCookie('themePreference') || 'D&D'
    setCookie('themePreference', chosenTheme)
    populateSelectWithThemes()
    const themeOptionElem = document.querySelector(`#selectTheme option[value="${chosenTheme}"]`)
    loadCSS(themeOptionElem?.dataset.css)
    updateFont(themeOptionElem?.dataset.font)

    /* Rehydrate the live text preference */
    liveTextMode = getCookie('liveTextMode') || 'true'
    document.getElementById('toggleLiveText').checked = liveTextMode

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

function setupEventListeners() {
    document.getElementById('refreshPageBtn').addEventListener('click', refreshPage)
    document.getElementById('settingsMenuBtn').addEventListener('click', toggleSettingsMenu)
    document.getElementById('toggleFullScreenBtn').addEventListener('change', toggleFullScreenMode)
    document.querySelector('#selectTheme').addEventListener('change', handleThemeChange)
    document.getElementById('toggleLiveText').addEventListener('change', toggleLiveTextMode)
    document.getElementById('appScalePref').addEventListener('change', (e)=> {updateAppScale(e.target.value)})
    document.getElementById('decrAppScale').addEventListener('click', decreaseAppScale)
    document.getElementById('incrAppScale').addEventListener('click', increaseAppScale)
    document.getElementById('brightnessPref').addEventListener('change', (e)=> {updateBrightnessLevel(e.target.value)})
    document.getElementById('decrBrightness').addEventListener('click', decreaseBrightness)
    document.getElementById('incrBrightness').addEventListener('click', increaseBrightness)
    document.querySelector('#selectFont').addEventListener('change', handleFontChange)
    document.getElementById('fontSizePref').addEventListener('change', (e)=> {updateFontSize(e.target.value)})
    document.getElementById('decrFontSize').addEventListener('click', decreaseFontSize)
    document.getElementById('incrFontSize').addEventListener('click', increaseFontSize)
    document.getElementById('chalkinessPref').addEventListener('change', (e)=> {updateChalkiness(e.target.value)})
    document.getElementById('decrChalkiness').addEventListener('click', decreaseChalkiness)
    document.getElementById('incrChalkiness').addEventListener('click', increaseChalkiness)
    document.getElementById('speechForm').addEventListener('submit', handleManualInputSubmit)
    document.getElementById('addPlayer').addEventListener('click', addPlayer)
    document.getElementById('prevTurn').addEventListener('click', goBackOneTurn)
    document.getElementById('nextTurn').addEventListener('click', advanceTurn)
    document.getElementById('clearAll').addEventListener('click', clearAll)
    document.getElementById('startDictation').addEventListener('click', handleDictationToggle)
    // document.getElementById('startDictation').addEventListener('mousedown', handleDictationMouseDown)
    // document.getElementById('startDictation').addEventListener('touchstart', handleDictationTouchStart)
    // document.getElementById('startDictation').addEventListener('mouseup', handleDictationMouseUp)
    // document.getElementById('startDictation').addEventListener('touchend', handleDictationTouchEnd)
    if (navigator.userAgent.match(/(iPhone|iPod)/i)) { document.getElementById('toggleFullScreenBtn').remove() };
    
    const events = ['input', 'change', 'keydown', 'focus', 'focusin', 'focusout', 'blur', 'beforeinput', 'compositionstart', 'compositionupdate', 'compositionend', 'select', 'paste', 'copy', 'submit']
    events.forEach(event => {
        document.getElementById("testInput").addEventListener(event, ()=>{console.debug(event)})
    })

    // Font Preference
    function handleFontChange(event) {
        const selectedClass = event.target.value
        updateFontSize(selectedClass)
    }
    
    // Dictation
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
            document.getElementById('startDictation').classList.add('active')
            if ('start' in recognition) recognition.start()
    
        } else {
            handleMicDisallowed()
        }
    }
    
    function handleMicOff() {
        if (micAllowed) {
            document.getElementById('startDictation').classList.remove('active')
            document.getElementById('startDictation').classList.add('thinking')
            document.getElementById('startDictation').disabled = true
            if ('stop' in recognition) recognition.stop()
        }
        console.info('Mic button released, or toggled off')
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

async function setupSpeechDicatation() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition. Please use a compatible browser or manually input your speech.')
        return
    }

    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
    
    // Grammar list... works?  but it miiight be eff'ing up the number interpretation.
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    var numbers = ['one','two','three','four','five','six','seven','eight','nine','ten'];
    var grammar = '#JSGF V1.0; grammar numbers; public <number> = ' + numbers.join(' | ') + ' ;'
    
    recognition = new SpeechRecognition()
    grammarList = new SpeechGrammarList();
    grammarList.addFromString(grammar, 1);
    recognition.grammars = grammarList;  // comment to turn grammar list off
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
    let pauseTimer = null // Initialize the pause timer variable
    let speechProcessedEvent = new Event('speechprocessed')

    
    function speechStartHandler(event) {
        console.debug('Speech started.')
        final_transcript = ''
    }
    
    function speechResultHandler(event) {
        let interim_transcript = ''
        micAllowed = true // if we got this far, mic is obviously allowed

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                // heard the completion of some word or phrase, and made a final decision about what it heard.
                // probably triggered by a tiny (but obvious) pause in speech
                console.debug(event)
                if (isStopCommand(event.results[i][0].transcript)) document.getElementById('startDictation').click()
                const probableResult = considerAlternatives(event.results[i])
                let spokenWords = probableResult.transcript
                const uniqueGroupNumberWords = {
                    'tutu':'2 2',
                    'want to':'1 2',
                    'want for':'1 4'
                }
                // Replace unique group-number words
                for (const [word, number] of Object.entries(uniqueGroupNumberWords)) {
                    let numberWordpattern = new RegExp(`\\b(${word})+\\b`, 'g')
                    spokenWords = spokenWords.replace(numberWordpattern, `${number}`)
                }
                final_transcript += spokenWords
                let temporaryInterpretation = convertNumberWordsToNumerals( makeSpellingCorrections( spokenWords ))
                finalTranscriptOutput.append(temporaryInterpretation)
                console.debug(`Recognized: "${spokenWords}"`)
                console.debug(`Confidence: ${probableResult.confidence}`)
                interim_transcript = ''
            } else {
                // heard small part, maybe just a syllable, but has not yet made a final decision about what it heard.
                interim_transcript += event.results[i][0].transcript
                // console.debug(`maybe: ${interim_transcript}`)
                // console.debug(event)
            }
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
        console.info(`Heard altogether: "${final_transcript}"`)
        console.info('Speech ended. Parsing results.')
        if (isEmpty(final_transcript)) {
            if (micAllowed && players.length === 0) document.querySelector('.post-mic').classList.add('show')
        } else if (isClearCommand(final_transcript)) {
            console.info(`CLEAR command detected: "${final_transcript}"`)
            clearAll()
        }else if( isCancelCommand(final_transcript)) {
            console.info(`CANCEL command detected: "${final_transcript}"`)
            final_transcript = ''
        } else {
            let interpretedTranscript = parseInput(final_transcript)
            interpretedTranscript = trimIncompletePattern(interpretedTranscript)
            console.info(`parsed results: ${interpretedTranscript}`)
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

    async function testMicPermission () {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            // User has granted microphone access
            micAllowed = true
            document.body.classList.remove('no-mic')
            
            // Now stop the audio stream
            stream.getTracks().forEach(track => track.stop())
            return true
        })
        .catch(error => {
            // Access denied or another error
            micAllowed = false
            document.body.classList.add('no-mic')
            return false
        })
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

    /** Test whether the speech recognition thinks it may have heard something different, and decide
     * if that alternative is actually the better choice in this context. If not, just return the
     * result that the SpeechRecognitionResult was most confident in.
     */

    function considerAlternatives(results) {
        // Sort the results array by confidence values in descending order
        const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence)
    
        // Preselect the highest confidence item
        let probableResult = sortedResults[0]
        let maxHits = 0
    
        // Generate patterns from numberMapSingleDigit
        const patterns = {};
        for (const word in numberMapSingleDigit) {
            const value = numberMapSingleDigit[word]
            if (!patterns[value]) {
                patterns[value] = []
            }
            patterns[value].push(word)

            // Add the numeral itself as a string, ensuring it's added only once
            if (!patterns[value].includes(value.toString())) {
                patterns[value].push(value.toString())
            }
        }
    
        // Iterate over alternatives
        for (let i = 0; i < sortedResults.length; i++) {
            const result = sortedResults[i]
            if (result.confidence < 0.3) continue
    
            let hitCount = 0
            // Test each number group pattern
            for (const num in patterns) {
                const groupWords = patterns[num].join('|')
                const regex = new RegExp(`\\b(${groupWords})(?!\\d)`, 'gi')
                let matches = result.transcript.match(regex) || []
                hitCount += matches.length
            }
    
            // Update the most hits result
            if (hitCount > maxHits) {
                maxHits = hitCount
                probableResult = result
                console.debug('chose alternative: ' + result.transcript)
            }
        }
        
        console.debug('dbl numeral HITS: ' + maxHits)
        return probableResult
    }
}


/**
 * App Settings Management
 */

function toggleSettingsMenu() {
    const settingsMenuButton = document.getElementById('settingsMenuBtn')
    const settingsMenu = document.querySelector('.settings-menu')
    const mainAppBody = document.querySelector('.main')
    settingsMenuButton.classList.toggle('menu-open')
    settingsMenu.classList.toggle('hide')
    mainAppBody.classList.toggle('hide')
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

function toggleLiveTextMode(event) {
    setCookie('liveTextMode', this.checked)
    liveTextMode = this.checked
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
    Array.from(document.body.classList).forEach(className => className.startsWith('font-') && document.body.classList.remove(className))
    document.body.classList.add(value)
    setCookie('fontPreference', value)
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
        const val = 'font-' + font.toLowerCase().replace(/\s+/g, '-') // Convert font name to classname format
        option.value = val
        if (val == chosenFont) {
            option.selected = true
        }
        option.textContent = font
        selectElement.appendChild(option)
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

function loadCSS(url, unloadURL = null) {
    // Create a new link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;

    // Append the link element to the head of the document
    document.head.appendChild(link);

    // Check if there's a CSS file to unload
    if (unloadURL) {
        // Find existing link elements with the same href
        const existingLinks = document.querySelectorAll('link[rel="stylesheet"][href="' + unloadURL + '"]');
        // Remove each existing link element
        existingLinks.forEach(existingLink => {
            existingLink.parentNode.removeChild(existingLink);
        });
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
    document.getElementById('startButton').disabled = true
}

function endCombat() {
    document.body.classList.remove('active-turn')
    document.getElementById('prevTurn').disabled = true
    document.getElementById('nextTurn').disabled = true
    document.getElementById('startButton').disabled = false
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
    final_transcript = ''
    allTranscripts = []
    endCombat()
    document.body.classList.remove('players-listed')
    document.getElementById('speechInput').value = ''
    document.querySelectorAll('.round-tally').forEach(el => el.remove())

    // Clearing cookies
    document.cookie = "players=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "turn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "round=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "turnStarted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "fontPreference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
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
    const regex = /(.+@ \d+)(?:\s|$).*/;
  
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
    input = input.replace(/\s+/g, ' ')
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
    // Guess at where roll "@" symbols should be added in: find numbers not adjacent to other numbers and insert @ before them (if the word ≈"rolled" WAS NOT said). \* handles curse words =) Ex: "john 4" to "john @ 4"
    input = input.replace(/([a-z\*]) (\d\d? (?=[a-z\*]|$))/g, (match, p1, p2) => `${p1} @ ${p2}`)

    return input
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
            el.setAttribute("pattern", "[0-9]*")
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
            postEditCleanup()
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
        if (e.type === 'keydown' && e.key !== 'Enter') return

        const newValue = (input.className === 'player-order') ? parseInt(input.value, 10) : input.value
        const doReorder = input.className === 'player-order' || (input.className === 'player-name' && newValue == '')
        
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
        postEditCleanup(doReorder)
    }

    function postEditCleanup(doReorder) {
        players = players.filter(p => !p.deleteme)
        if (doReorder) players.sort((a, b) => b.order - a.order)

        allTranscripts = [generatedPlayersTranscript(players)]
        if (doReorder) renderPlayers()
        setCookie('players', JSON.stringify(players))
    }
}


/**
 * Cookie Management
 */

function setCookie(name, value) {
    document.cookie = `${name}=${value};path=/`
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
 * Logging
 */
function outLogsToSettingsPage() {
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
