
let micAllowed = false
let chosenFont
let players = []
let currentTurn = 0
let currentRound = 1
let recognition;
let final_transcript = ''
let allTranscripts = []
let aliasMap = {
    'brinley': 'brynlee',
    'zoe': 'zoey',
    'casey': 'kacie',
    'claris': 'killaris',
    'broke off': 'brogoth',
    'share zoo': 'sherzu',
    'tensing': 'tenzing',
    'car': 'kaa'
}
const numberMap = {
    'zero': 0,
    'one': 1, 'won': 1,
    'two': 2, 'to': 2, 'too': 2, 'ii': 2,
    'three': 3, 'tree': 3, 'iii': 3,
    'four': 4, 'fore': 4, 'for': 4, 'forth': 4, 'fourth': 4, '4th': 4, 'iv': 4,
    'five': 5, 'fi': 5, 'fife': 5, 'v': 5, "vie": 5,
    'six': 6, 'sex': 6, 'sixth': 6, '6th': 6, 'vi': 6,
    'seven': 7, '7th': 7, 'vii': 7,
    'eight': 8, 'ate': 8, 'eighth': 8, '8th': 8, 'viii': 8,
    'nine': 9, 'nigh': 9, 'ninth': 9, '9th': 9, 'ix': 9,
    'ten': 10, 'tin': 10, 'tenth': 10, '10th': 10,
    'eleven': 11, 'eleventh': 11, '11th': 11,
    'twelve': 12, 'twelveth': 12, '12th': 12,
    'thirteen': 13, 'thirteenth': 13, '13th': 13,
    'fourteen': 14, 'fourteenth': 14, '14th': 14,
    'fifteen': 15, 'fifteenth': 15, '15th': 15,
    'sixteen': 16, 'sixteenth': 16, '16th': 16,
    'seventeen': 17, 'seventeenth': 17, '17th': 17,
    'eighteen': 18, 'eighteenth': 18, '18th': 18,
    'nineteen': 19, 'nineteenth': 19, '19th': 19,
    'twenty': 20, 'twentieth': 20,
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

Element.prototype.onClassAdded = function (className, callback) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const oldClassList = mutation.oldValue ? mutation.oldValue.split(/\s+/) : []
                const newClassList = this.className.split(/\s+/)
                if (newClassList.includes(className) && !oldClassList.includes(className)) {
                    callback()
                }
            }
        })
    })
    observer.observe(this, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] })
}

Element.prototype.onClassRemoved = function (className, callback) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const oldClassList = mutation.oldValue ? mutation.oldValue.split(/\s+/) : []
                const newClassList = this.className.split(/\s+/)
                if (!newClassList.includes(className) && oldClassList.includes(className)) {
                    callback()
                }
            }
        })
    })
    observer.observe(this, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] })
    // Usage
    // document.body.onClassAdded('active-turn', function() { /* do stuff */ });
    // document.body.onClassRemoved('active-turn', function() { /* do stuff */ });
}

window.onload = async function () {

    main()

}

async function main() {
    outLogsToSettingsPage();

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
    document.documentElement.style.setProperty('--adjustable-font-size', parseFloat(cookieFontSize) + 'em')
    
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

    /* Rehydrate the current turn, if it was recorded */
    const turnStarted = getCookie('turnStarted')
    if (turnStarted) {
        document.body.classList.add('active-turn')
    }
    const savedTurn = getCookie('turn')
    if (savedTurn) {
        currentTurn = parseInt(savedTurn, 10)
        highlightCurrentTurn()
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

    document.getElementById('refreshPageBtn').addEventListener('click', ()=> {
        refreshPage()
    })

    document.getElementById('settingsMenuBtn').addEventListener('click', ()=> {
        toggleSettingsMenu()
    })

    document.getElementById('appScalePref').addEventListener('change', (e)=> {
        updateAppScale(e.target.value)
    })

    document.getElementById('decrAppScale').addEventListener('click', ()=> {
        decreaseAppScale()
    })

    document.getElementById('incrAppScale').addEventListener('click', ()=> {
        increaseAppScale()
    })

    document.getElementById('brightnessPref').addEventListener('change', (e)=> {
        updateBrightnessLevel(e.target.value)
    })

    document.getElementById('decrBrightness').addEventListener('click', ()=> {
        decreaseBrightness()
    })

    document.getElementById('incrBrightness').addEventListener('click', ()=> {
        increaseBrightness()
    })

    document.getElementById('fontSizePref').addEventListener('change', (e)=> {
        updateFontSize(e.target.value)
    })

    document.getElementById('decrFontSize').addEventListener('click', ()=> {
        decreaseFontSize()
    })

    document.getElementById('incrFontSize').addEventListener('click', ()=> {
        increaseFontSize()
    })

    document.getElementById('chalkinessPref').addEventListener('change', (e)=> {
        updateChalkiness(e.target.value)
    })

    document.getElementById('decrChalkiness').addEventListener('click', ()=> {
        decreaseChalkiness()
    })

    document.getElementById('incrChalkiness').addEventListener('click', ()=> {
        increaseChalkiness()
    })

    document.getElementById('speechForm').addEventListener('submit', handleManualInputSubmit)

    document.getElementById('startButton').addEventListener('click', ()=> {
        startTurnCounter()
    })    

    document.getElementById('prevTurn').addEventListener('click', ()=> {
        goBackOneTurn()
    })    

    document.getElementById('nextTurn').addEventListener('click', ()=> {
        advanceTurn()
    })    

    document.getElementById('clearAll').addEventListener('click', ()=> {
        clearAll()
    })

    // Asynchronously check to see if the microphone permission has been granted during the session
    micAllowed = await testMicPermission()

    // set the state of the Previous buttton based on rehydrated round/turn state
    document.getElementById('prevTurn').disabled = (currentRound < 2 && currentTurn < 1)

    document.getElementById('startDictation').addEventListener('mousedown', function (e) {
        e.preventDefault()
        handleMicPress()
        this.classList.add('active');
    })
    document.getElementById('startDictation').addEventListener('touchstart', function (e) {
        e.preventDefault()
        handleMicPress()
        this.classList.add('active');
    })
    document.getElementById('startDictation').addEventListener('mouseup', function (e) {
        e.preventDefault()
        handleMicRelease()
        this.classList.remove('active');
    })
    document.getElementById('startDictation').addEventListener('touchend', function (e) {
        e.preventDefault()
        handleMicRelease()
        this.classList.remove('active');
    })

    const events = ['input', 'change', 'keydown', 'focus', 'focusin', 'focusout', 'blur', 'beforeinput', 'compositionstart', 'compositionupdate', 'compositionend', 'select', 'paste', 'copy', 'submit']
    events.forEach(function (event) {
        document.getElementById("testInput").addEventListener(event, function (e) {
            logEvent(e)
        })
    })

    document.body.onClassAdded('active-turn', function () {
        console.debug('active-turn class was added')
        document.getElementById('prevTurn').disabled = true
        document.getElementById('nextTurn').disabled = false
        document.getElementById('startButton').disabled = true
    })

    document.body.onClassRemoved('active-turn', function () {
        console.debug('active-turn class was removed')
        document.getElementById('prevTurn').disabled = true
        document.getElementById('nextTurn').disabled = true
        document.getElementById('startButton').disabled = false
    })
    
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
    recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    var interimOutput = document.getElementById('interimWords')
    var finalOutput = () => document.getElementById('eventlog')
    let pauseTimer = null // Initialize the pause timer variable
    let speechProcessedEvent = new Event('speechprocessed')

    recognition.onstart = speechStartHandler
    recognition.onresult = speechResultHandler
    recognition.onnomatch = speechNoMatchHandler
    recognition.onerror = speechErrorHandler
    recognition.onend = speechEndHandler
    
    function speechStartHandler(event) {
        console.debug('Speech started.')
        final_transcript = ''
        finalOutput.innerHTML = final_transcript
    }
    
    function speechResultHandler(event) {
        let interim_transcript = ''
        micAllowed = true // if we got this far, mic is obviously allowed

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const spokenWords = event.results[i][0].transcript
                final_transcript += spokenWords
                console.debug(`heard: "${spokenWords}"`)
                console.debug(event)
                interim_transcript = ''
            } else {
                interim_transcript += event.results[i][0].transcript
            }
            console.debug(`Confidence: ${event.results[i][0].confidence}`)
        }

        interimOutput.innerHTML = interim_transcript
        document.querySelector('.post-mic').classList.remove('show')
        console.debug(`heard: ${event.results[0][0].transcript}`)
    }

    function speechNoMatchHandler(event) {
        const huh = ['[incoherent]', '???', '[mumbling]', '[drunken slurring]', '[something something...]'][Math.floor(Math.random() * 5)]
        interimOutput.textContent = huh
        console.debug(event)
    }

    function speechErrorHandler(event) {
        interimOutput.textContent = '[Error]'
        console.error(`Error occurred in recognition: ${event.error}\nError message: ${event.message}`)
        console.debug(event)
    }
    
    function speechEndHandler() {
        console.info(`heard: "${final_transcript}"`)
        console.debug('Speech ended. Parsing results.')
        if (isEmpty(final_transcript)) {
            if (micAllowed && players.length === 0) document.querySelector('.post-mic').classList.add('show')
        } else if (isClearCommand(final_transcript)) {
            console.info(`clear command detected: ${final_transcript}`)
            clearAll()
        }else if( isStartCommand(final_transcript)) {
            console.info(`start command detected: ${final_transcript}`)
            if (players.length) startTurnCounter();
        } else {
            finalOutput.innerHTML = final_transcript
            allTranscripts.push(final_transcript)
            parseAndAddEntries()
        }
        document.getElementById('startDictation').classList.remove('thinking')
        document.getElementById('startDictation').disabled = false
        document.dispatchEvent(speechProcessedEvent)
    }
}

function refreshPage() {
    location.reload();
}

function generatedPlayersTranscript(playersObj) {
    return playersObj.map(player => `${player.name} @ ${player.order}`).join(', ') + ', '
}

function toggleSettingsMenu() {
    const settingsMenuButton = document.getElementById('settingsMenuBtn')
    const settingsMenu = document.querySelector('.settings-menu')
    const mainAppBody = document.querySelector('.main')
    settingsMenuButton.classList.toggle('menu-open')
    settingsMenu.classList.toggle('hide')
    mainAppBody.classList.toggle('hide')
}

function updateAppScale(value) {
    document.documentElement.style.setProperty('--adjustable-app-scale', (parseFloat(value) * 8) + 'px')
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
    document.documentElement.style.setProperty('--brightness-level', parseFloat(value))
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
    document.documentElement.style.setProperty('--adjustable-font-size', parseFloat(value) + 'em')
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

function updateChalkiness(value) {
    document.documentElement.style.setProperty('--adjustable-chalkiness', 1 - parseFloat(value))
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
        'Creatinin-pro', 'Dawning of a New Day', 'Dracufrankenwolfbb', 'East Sea Dokdo', 'Eordeoghlakat', 'Fibyngerowa', 'Fuggles',
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

function parseAndAddEntries() {

    const joinedInput = allTranscripts.join(' ')
    let convertedInput = parseInput(joinedInput, numberMap)

    const regex = /([a-zA-Z0-9_'-\s]+?)\s*?@ (-?\d+)/g
    let matches

    players = []
    while ((matches = regex.exec(convertedInput)) !== null) {
        let name = matches[1].trim()
        let orderString = matches[2]

        let order
        if (orderString && isNaN(orderString)) {
            order = numberMap[orderString.toLowerCase()] || NaN
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
    allTranscripts = [generatedPlayersTranscript(players)];
    setCookie('players', JSON.stringify(players))
    if (players.length) {
        renderPlayers()
    }
}

function parseInput(input, numberMap) {
    console.debug('Before processing: ' + input)

    // Replace punctuation with spaces
    input = input.replace(/[.,!?;:()]/g, ' ')
    // Trim all spaces to single space
    input = input.replace(/\s+/g, ' ')
    // Make lowercase
    input = input.toLowerCase()
    // Add a space to the end
    input = input + ' '
    // Replace stored spelling/word corrections
    for (const [heard, correctWord] of Object.entries(aliasMap)) {
        let aliasWordpattern = new RegExp(`\\b${heard}\\b`, 'g')
        input = input.replace(aliasWordpattern, `${correctWord}`)
    }
    // Replace number words
    for (const [word, number] of Object.entries(numberMap)) {
        let numberWordpattern = new RegExp(`\\b${word}\\b`, 'g')
        input = input.replace(numberWordpattern, `${number}`)
    }
    // Replace the roll/role variations with the symbol "@"
    input = input.replace(new RegExp(` (${aliasesForRolled.join('|')})( a| an| and| of| on| [aeu]h+|)? `, 'g'), ' @ ')
    // Split up WORD-## ex: "demon-12" to "demon 12"
    input = input.replace(/([a-z])-(\d+)/g, (match, p1, p2) => `${p1} ${p2}`)
    // Handle negative numbers
    input = input.replace(/\bnegative (\d+)/g, (match, p1) => `-${p1}`)
    // Guess at where roll "@" symbols should be added in: split triple digits into for ex: "311" to "3 @ 11"
    input = input.replace(/\b(\d)(\d\d)/g, (match, p1, p2) => `${p1} @ ${p2}`);
    // Guess at where roll "@" symbols should be added in: find adjacent numbers and insert @ between them (if the word ≈"rolled" WAS NOT said)
    input = input.replace(/\b(\d\d?) (-?\d\d?)/g, (match, p1, p2) => `${p1} @ ${p2}`);
    // Guess at where roll "@" symbols should be added in: find numbers not adjacent to other numbers and insert @ before them (if the word ≈"rolled" WAS NOT said)
    input = input.replace(/([a-z]) (\d\d? (?=[a-z]|$))/g, (match, p1, p2) => `${p1} @ ${p2}`);

    console.info(`parsed results: ${input}`)

    return input
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function handleManualInputSubmit(e) {
    if (e.type === 'submit') {
        e.preventDefault()
    }
    const speechInput = e.target.querySelector('input')
    allTranscripts.push(speechInput.value)
    parseAndAddEntries()
    speechInput.value = ''
}

function startTurnCounter() {
    highlightCurrentTurn()
    document.body.classList.add('active-turn')
    updateTally(currentRound)
    setCookie('round', currentRound)
    setCookie('turnStarted', 'true')
}
function advanceTurn() {
    let skippedTurns = 0; // Counter to ensure we don't end up in an infinite loop
    do {
        currentTurn = (currentTurn + 1) % players.length;

        // Start a new round if it wraps back to the first player
        if (currentTurn == 0) {
            currentRound++;
            updateTally(currentRound);
            setCookie('round', currentRound);
        }

        // Increment the skipped turns counter
        skippedTurns++;
    } while (players[currentTurn].dead && skippedTurns < players.length); // Continue if the player is dead, but not if we've looped through all players

    // Handle the situation where all players are dead (if necessary)
    if (skippedTurns >= players.length) {
        // Handle the scenario where all players are dead. E.g., display a message or take some other action.
        console.error("All players are dead.");
        return;
    }

    highlightCurrentTurn();

    document.getElementById('prevTurn').disabled = false;
}

function goBackOneTurn() {
    let skippedTurns = 0; // Counter to ensure we don't end up in an infinite loop

    do {
        currentTurn--;

        // If it wraps back to the last player
        if (currentTurn == -1) {
            currentTurn = players.length - 1;
            currentRound--;

            // Reset if we went back to "round 0"
            if (currentRound == 0) {
                currentRound = 1;
                currentTurn = 0;
                turnStarted = false;
                setCookie('turnStarted', 'false');
            }

            updateTally(currentRound);
            setCookie('round', currentRound);
        }

        // Increment the skipped turns counter
        skippedTurns++;
    } while (players[currentTurn].dead && skippedTurns < players.length); // Continue if the player is dead, but not if we've looped through all players

    // Handle the situation where all players are dead (if necessary)
    if (skippedTurns >= players.length) {
        // Handle the scenario where all players are dead. E.g., display a message or take some other action.
        console.error("All players are dead.");
        return;
    }

    highlightCurrentTurn();
    setCookie('turn', currentTurn);

    if (currentRound == 1 && currentTurn == 0) {
        document.getElementById('prevTurn').disabled = true;
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

function clearAll() {
    if (!confirm('Clear Everything?')) return
    players = []
    currentTurn = 0
    currentRound = 1
    renderPlayers()
    final_transcript = ''
    allTranscripts = []
    document.body.classList.remove('active-turn')
    document.body.classList.remove('players-listed')
    document.getElementById('speechInput').value = ''
    document.getElementById('eventlog').textContent = ''
    document.querySelectorAll('.round-tally').forEach(el => el.remove())

    // Clearing cookies
    document.cookie = "players=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "turn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "round=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "turnStarted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "fontPreference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
}

function renderPlayers() {
    const list = document.getElementById('entries');
    list.innerHTML = '';

    players.forEach(player => {
        const li = document.createElement('li');
        li.appendChild(createPlayerRow('player-order', player));
        li.appendChild(createPlayerRow('player-name', player));
        li.appendChild(createPlayerRow('player-badge', player));
        list.appendChild(li);
    });

    document.body.classList.add('players-listed');
    highlightCurrentTurn();

    function createPlayerRow(type, player) {
        switch (type) {
            case 'player-order':
                return createInput(type, player.order, player);
            case 'player-name':
                if (player.dead) {
                    return createDeadPlayerNameElement(type, player.name);
                }
                return createInput(type, player.name, player);
            case 'player-badge':
                return createBadgeIcon(type, player);
        }
    }

    function createInput(className, value, player) {
        const el = document.createElement('input');
        el.className = className;
        el.value = value;

        if (className === 'player-order') {
            el.setAttribute("pattern", "[0-9]*");
        } else if (className === 'player-name') {
            el.setAttribute("autocapitalize", "words");
            if (player.bloodied) el.classList.add('bloodied');
        }

        el.addEventListener('keydown', handleEdit.bind(null, player, el));
        el.addEventListener('focusout', handleEdit.bind(null, player, el));

        return el;
    }

    function createDeadPlayerNameElement(type, name) {
        const el = document.createElement('div');
        el.classList = `${type} strike-thru`;
        el.textContent = name;
        return el;
    }

    function createBadgeIcon(className, player) {
        const el = document.createElement('div');
        el.classList = className;
        el.setAttribute('tabindex', '0');

        const { icon, action } = getBadgeIconData(player);

        el.innerHTML = `<i class="${icon}">`;
        el.addEventListener('click', () => {
            action(player);
            postEditCleanup();
        });

        return el;
    }

    function getBadgeIconData(player) {
        if (player.dead) {
            return {
                icon: 'fas fa-skull',
                action: (player) => {
                    player.dead = false;
                    player.bloodied = false;
                }
            };
        } else if (player.bloodied) {
            return {
                icon: 'fas fa-heart-crack',
                action: (player) => {
                    player.dead = true;
                    player.bloodied = false;
                }
            };
        } else {
            return {
                icon: 'fa-brands fa-d-and-d',
                action: (player) => {
                    player.dead = false;
                    player.bloodied = true;
                }
            };
        }
    }

    function handleEdit(player, input, e) {
        if (e.type === 'keydown' && e.key !== 'Enter') return;

        const newValue = (input.className === 'player-order') ? parseInt(input.value, 10) : input.value;
        
        switch (input.className) {
            case 'player-order':
                player.order = newValue;
                break;
            case 'player-name':
                if (newValue) {
                    player.name = newValue;
                } else {
                    player.deleteme = true;
                }
                break;
            case 'player-badge':
                player.badge = newValue;
                break;
        }

        postEditCleanup();
    }

    function postEditCleanup() {
        players = players.filter(p => !p.deleteme);
        players.sort((a, b) => b.order - a.order);

        allTranscripts = [generatedPlayersTranscript(players)];
        renderPlayers();
        setCookie('players', JSON.stringify(players));
    }
}


function highlightCurrentTurn() {
    const listItems = document.querySelectorAll('#entries li')
    listItems.forEach(li => li.classList.remove('highlighted'))
    if (listItems[currentTurn]) {
        listItems[currentTurn].classList.add('highlighted')
    }
}

function setCookie(name, value) {
    document.cookie = `${name}=${value};path=/`
}

function getCookie(name) {
    const value = "; " + document.cookie
    const parts = value.split("; " + name + "=")
    if (parts.length == 2) return parts.pop().split(";").shift()
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
      });
  }

function handleMicDisallowed() {
    micAllowed = false
    document.body.classList.add('no-mic');
    document.querySelector('.denied-mic').classList.add('show')
    document.getElementById('startDictation').classList.remove('thinking')
    document.getElementById('startDictation').classList.add('disabled')
    document.getElementById('speechForm').classList.add('show')
}

function isEmpty(str) {
    // Test whether the voice transcription is empty.
    return str.trim() == ''
}

function isClearCommand(str) {
    // Test whether the user said (and said only) "clear", "cancel", or "start over".
    return /^(clear|cancel|start over)$/i.test(str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
}

function isStartCommand(str) {
    // Test whether the user said (and said only) "start", "begin", "go", "round one", or "fight".
    return /^(and )?(let's )?(start|begin|let us begin|go|round one|round 1|fight|let the games begin|party|rock|rock and roll|rock 'n' roll|boogie|get ready to rumble|ready|ready set go)$/i.test(str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
}

function handleMicPress() {
    if (micAllowed) {
        recognition.start()

    } else {
        handleMicDisallowed()
    }
}

function handleMicRelease() {
    if (micAllowed) {
        document.getElementById('startDictation').classList.add('thinking')
        document.getElementById('startDictation').disabled = true
        recognition.stop()
    }
    console.debug('Mic button released.')
}

function logEvent(e) {
    console.log(e.type)
    document.getElementById('eventlog').innerHTML += ('<br/>' + e.type + (e.type == 'keydown' ? ' ' + e.which : ''))
}

function outLogsToSettingsPage() {
    let outputLogsToText = true // Toggle this to control logging behavior
    const eventLog = document.getElementById('eventlog');

    const originalConsole = {
        log: console.log,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        error: console.error
    };

    function appendToEventLog(type, args) {
        if (outputLogsToText && eventLog) {
            // eventLog.innerHTML += `[${type.toUpperCase()}]: ${args.join(' ')}<br>`
            eventLog.innerHTML += `${args.join(' ')}<br>`
        }
    }

    // console.log = function (...args) {
    //     originalConsole.log.apply(console, args)
    //     appendToEventLog('log', args)
    // };

    console.warn = function (...args) {
        originalConsole.warn.apply(console, args)
        appendToEventLog('warn', args)
    };

    console.info = function (...args) {
        originalConsole.info.apply(console, args)
        appendToEventLog('info', args)
    };

    // console.debug = function (...args) {
    //     originalConsole.debug.apply(console, args)
    //     appendToEventLog('debug', args)
    // };

    console.error = function (...args) {
        originalConsole.error.apply(console, args)
        appendToEventLog('error', args)
    };

    // Expose the variable to the global scope if you need to toggle it outside of this function
    window.toggleLogOutput = function(val) {
        outputLogsToText = !!val
    };

    // If you want to stop logging to the <p> element, use:
    // toggleLogOutput(false)
}
