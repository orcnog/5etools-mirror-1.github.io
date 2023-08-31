
let micAllowed = false
let chosenFont
let players = []
let currentTurn = 0
let currentRound = 1
let final_transcript = ''
let allTranscripts = []
const numberMap = {
    'zero': 0,
    'one': 1, 'won': 1,
    'two': 2, 'to': 2, 'too': 2, 'ii': 2,
    'three': 3, 'tree': 3, 'iii': 3,
    'four': 4, 'fore': 4, 'for': 4, 'forth': 4, 'fourth': 4, '4th': 4, 'iv': 4,
    'five': 5, 'fi': 5, 'fife': 5, 'v': 5,
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

window.onload = function () {
    /* Get font config from cookie */
    chosenFont = getCookie('fontPreference') || 'font-nothing-you-could-do'
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

    /* Get brightness conif from cookie */
    const cookieBrightness = getCookie('brightnessPreference') || 1
    document.getElementById('brightness').value = parseFloat(cookieBrightness)
    document.documentElement.style.setProperty('--brightness-level', parseFloat(cookieBrightness))

    // Recall player entries saved to cookie
    const savedEntries = getCookie('players')
    if (savedEntries) {
        players = JSON.parse(savedEntries)
        renderPlayers()
    }

    // Rehydrate the current turn, if it was recorded
    const turnStarted = getCookie('turnStarted')
    if (turnStarted) {
        document.body.classList.add('active-turn')
    }
    const savedRound = getCookie('round')
    if (savedRound) {
        currentRound = parseInt(savedRound, 10)

        // Rehydrate the tally marks on page refresh
        if (savedRound > 0) {
            updateTally(savedRound)
        }
    }
    const savedTurn = getCookie('turn')
    if (savedTurn) {
        currentTurn = parseInt(savedTurn, 10)
        highlightCurrentTurn()
    }

    // Handle microphone permissions

    // Asynchronously check to see if the microphone permission has been granted during the session
    navigator.permissions.query({ name: 'microphone' }).then(function (permissionStatus) {
        if (micAllowed || players.length > 0) {
            return // assume they know what they're doing; remove help message
        }
        if (permissionStatus.state !== 'granted') {
            // Microphone permission is not yet granted
            console.log('Microphone permission is not yet granted.')
            document.querySelector('.pre-microphone-msg').classList.add('show')

            // Listen for changes to the permission state
            permissionStatus.onchange = function () {
                // alert(this.state + ' (onchange event)')
                if (this.state === 'granted') {
                    console.log('Microphone permission was just granted')
                    micAllowed = true
                    document.querySelector('.pre-microphone-msg').classList.remove('show')
                    document.querySelector('.post-microphone-msg').classList.add('show')
                }
            }

            function showFirstTimerMessageOnce() {
                document.querySelector('.pre-microphone-msg').classList.remove('show')
                document.querySelector('.post-microphone-msg').classList.add('show')
                document.getElementById('startDictation').removeEventListener('touchstart', showFirstTimerMessageOnce)
            }
            document.getElementById('startDictation').addEventListener('touchstart', showFirstTimerMessageOnce)
        } else {
            micAllowed = true
        }
    })

    // set the state of the Previous buttton based on rehydrated round/turn state
    document.getElementById('prevTurn').disabled = (currentRound < 2 && currentTurn < 1)

    document.getElementById('startDictation').addEventListener('mousedown', function (e) {
        e.preventDefault()
        handleMicPress()
    })
    document.getElementById('startDictation').addEventListener('touchstart', function (e) {
        e.preventDefault()
        handleMicPress()
    })
    document.getElementById('startDictation').addEventListener('mouseup', function (e) {
        e.preventDefault()
        handleMicRelease()
    })
    document.getElementById('startDictation').addEventListener('touchend', function (e) {
        e.preventDefault()
        handleMicRelease()
    })


    // // SPEECH INPUT BUTTON HANDLING ==========================================

    // document.getElementById('speechInput').addEventListener('focus', function(e) {
    //     logEvent(e)
    //     this.select()
    // })
    // document.getElementById('speechInput').addEventListener('focusout', function(e) {
    //     logEvent(e)
    //     parseAndAddEntries()
    // })

    // // Submit handler
    // document.getElementById("speechForm").parentElement.addEventListener('submit', function(e) {
    //     e.preventDefault()
    //     logEvent(e)
    //     parseAndAddEntries()
    //     setTimeout(()=>{document.getElementById('startButton').focus()}, 1)
    // })

    const events = ['input', 'change', 'keydown', 'focus', 'focusin', 'focusout', 'blur', 'beforeinput', 'compositionstart', 'compositionupdate', 'compositionend', 'select', 'paste', 'copy', 'submit']
    events.forEach(function (event) {
        document.getElementById("testInput").addEventListener(event, function (e) {
            logEvent(e)
        })
    })

    function logEvent(e) {
        console.log(e.type)
        document.getElementById('eventlog').innerHTML += ('<br/>' + e.type + (e.type == 'keydown' ? ' ' + e.which : ''))
    }

    document.body.onClassAdded('active-turn', function () {
        console.log('active-turn was added')
        document.getElementById('prevTurn').disabled = true
        document.getElementById('nextTurn').disabled = false
        document.getElementById('startButton').disabled = true
    })

    document.body.onClassRemoved('active-turn', function () {
        console.log('active-turn was removed')
        document.getElementById('prevTurn').disabled = true
        document.getElementById('nextTurn').disabled = true
        document.getElementById('startButton').disabled = false
    })
}

function toggleSettingsMenu() {
    const settingsMenuButton = document.getElementById('settingsMenuBtn')
    const settingsMenu = document.querySelector('.settings-menu')
    const mainAppBody = document.querySelector('.main')
    settingsMenuButton.classList.toggle('back')
    settingsMenu.classList.toggle('hide')
    mainAppBody.classList.toggle('hide')
}

function updateBrightnessLevel(value) {
    document.documentElement.style.setProperty('--brightness-level', parseFloat(value))
    setCookie('brightnessPreference', parseFloat(value))
}

function increaseBrightness() {
    var brightnessInput = document.getElementById('brightness')
    const currentValue = parseFloat(brightnessInput.value)
    if (currentValue < 3) {
        brightnessInput.value = parseFloat(brightnessInput.value) + 0.25
        brightnessInput.dispatchEvent(new Event('change'))
    }
}

function decreaseBrightness() {
    var brightnessInput = document.getElementById('brightness')
    const currentValue = parseFloat(brightnessInput.value)
    if (currentValue > 0.25) {
        brightnessInput.value = currentValue - 0.25
        brightnessInput.dispatchEvent(new Event('change'))
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
    let convertedInput = processInput(joinedInput, numberMap)

    const regex = /([\w\s]+?)\s*?@ (-?\d+)/g
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
        players.push({ name: name, order: order })
    }

    // Sorting and rendering the players
    players.sort((a, b) => b.order - a.order)
    renderPlayers()
    setCookie('players', JSON.stringify(players))
}

function processInput(input, numberMap) {
    console.log('Before processing: ' + input)

    // Replace punctuation with spaces
    input = input.replace(/[.,!?;:()]/g, ' ')
    // Trim all spaces to single space
    input = input.replace(/\s+/g, ' ')
    // Make lowercase
    input = input.toLowerCase()
    // Add a space to the end
    input = input + ' '
    // Replace the roll/role variations with the symbol "@"
    input = input.replace(/ (rolled|rolls|roll|roles|role|roads|road|rd|ruled|rules|rule|world|whirled|whirl|wrote|rote)( a| an| and| of| on| ah)? /g, ' @ ')
    // Replace number words
    for (const [word, number] of Object.entries(numberMap)) {
        let numberWordpattern = new RegExp(`\\b${word}\\b`, 'g')
        input = input.replace(numberWordpattern, `${number}`)
    }
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

    console.log('After processing: ' + input)

    return input
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function startTurnCounter() {
    highlightCurrentTurn()
    document.body.classList.add('active-turn')
    updateTally(currentRound)
    setCookie('round', currentRound)
    setCookie('turnStarted', 'true')
}

function advanceTurn() {
    currentTurn = (currentTurn + 1) % players.length
    setCookie('turn', currentTurn)

    // Start a new round if it wraps back to the first player
    if (currentTurn == 0) {
        currentRound++
        updateTally(currentRound)
        setCookie('round', currentRound)
    }

    highlightCurrentTurn()

    document.getElementById('prevTurn').disabled = false
}

function goBackOneTurn() {
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

    highlightCurrentTurn()
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
    roundCounter.querySelector('.round-label').textContent = (roundNumber == 1 ? 'Round ' : '')
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
    const list = document.getElementById('entries')
    list.innerHTML = ''
    for (let entry of players) {
        const li = document.createElement('li')

        const nameSpan = document.createElement('span')
        nameSpan.className = 'player-name'
        nameSpan.setAttribute('tabindex', '0')
        nameSpan.textContent = entry.name
        nameSpan.onclick = function () {
            makeEditable(nameSpan, entry, 'name', 'text')
        }
        nameSpan.onfocus = function () {
            makeEditable(nameSpan, entry, 'name', 'text')
        }

        const orderSpan = document.createElement('span')
        orderSpan.textContent = `${entry.order}`
        orderSpan.className = 'player-order'
        orderSpan.setAttribute('tabindex', '0')
        orderSpan.onfocus = function () {
            makeEditable(orderSpan, entry, 'order', 'number')
        }
        orderSpan.onclick = function () {
            makeEditable(orderSpan, entry, 'order', 'number')
        }

        li.appendChild(nameSpan)
        li.appendChild(orderSpan)
        list.appendChild(li)
    }
    document.body.classList.add('players-listed')
}


function makeEditable(element, entry, field, type) {
    const input = document.createElement('input')
    input.classList = element.classList
    input.classList.add('input-editable')
    input.type = type
    if (type == 'number') {
        input.setAttribute("pattern", "[0-9]*")
    } else {
        input.setAttribute("autocapitalize", "words")
    }
    input.value = entry[field]

    // Handle "submit" when Enter key is pressed
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            handleEdit()
        }
    })

    // Handle "submit" when input loses focus
    input.addEventListener('focusout', handleEdit)

    function handleEdit() {
        entry[field] = field === 'order' ? parseInt(input.value, 10) : input.value
        players.sort((a, b) => b.order - a.order) // Re-sorting on edit
        renderPlayers()
        setCookie('players', JSON.stringify(players))
    }

    element.replaceWith(input)
    input.select()
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

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var recognition = new SpeechRecognition()

// SPEECH API GRAMMER LIST ISN'T SUPPORTED IN CHROME... I GUESS?
// // Speech Recognition!
// var SpeechGrammarList = SpeechGrammarList || window.webkitSpeechGrammarList;

// // Fetch the grammar words from a local file
// fetch('/spellcheck/monster-names.txt')
//     .then(response => response.text())
//     .then(text => {
//         var words = text.split('\n') // Assuming words are separated by newlines

//         if (SpeechGrammarList) {
//             var speechRecognitionList = new SpeechGrammarList()
//             var grammar = '#JSGF V1.0; grammar words; public <word> = ' + words.join(' | ') + ' ;'
//             speechRecognitionList.addFromString(grammar, 1)
//             recognition.grammars = speechRecognitionList
//         }
//     })
//     .catch(error => {
//         console.error("Error fetching the grammar words:", error)
//     })

recognition.continuous = true
recognition.lang = 'en-US'
recognition.interimResults = true
recognition.maxAlternatives = 3

var interimOutput = document.getElementById('interimWords')
var finalOutput = document.getElementById('eventlog')
let pauseTimer = null // Initialize the pause timer variable
let speechProcessedEvent = new Event('speechprocessed')

recognition.onstart = function (event) {
    console.log('Speech started.')
    final_transcript = ''
    finalOutput.innerHTML = final_transcript
    document.getElementById('speechInput').value = final_transcript
}

recognition.onresult = function (event) {
    let interim_transcript = ''
    micAllowed = true // if we got this far, mic is obv allowed

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            const spokenWords = event.results[i][0].transcript
            final_transcript += spokenWords
            console.log('final: ' + spokenWords)
            interim_transcript = ''
        } else {
            interim_transcript += event.results[i][0].transcript
        }
        console.log('Confidence: ' + event.results[i][0].confidence)
    }

    interimOutput.innerHTML = interim_transcript
    document.querySelector('.post-microphone-msg').classList.remove('show')
    console.log(event.results)
}

recognition.onnomatch = function (event) {
    const huh = ['[incoherent]', '???', '[mumbling]', '[drunken slurring]', '[something something...]'][Math.floor(Math.random() * 5)]
    interimOutput.textContent = huh
    console.warn(huh)
    console.log(event)
}

recognition.onerror = function (event) {
    interimOutput.textContent = 'Error occurred in recognition: ' + event.error
    console.error(event)
}

recognition.onend = function (event) {
    console.warn('Speech ended. Parsing results.')
    if (isEmpty(final_transcript)) {
        if (micAllowed && players.length === 0) document.querySelector('.post-microphone-msg').classList.add('show')
    } else if (isClearCommand(final_transcript)) {
        clearAll()
    } else {
        finalOutput.innerHTML = final_transcript
        allTranscripts.push(final_transcript)
        parseAndAddEntries(final_transcript)
    }
    document.getElementById('startDictation').classList.remove('thinking')
    document.getElementById('startDictation').disabled = false
    document.dispatchEvent(speechProcessedEvent)
}

function isEmpty(str) {
    // Test whether the user said (and said only) "clear", "cancel", or "start over".
    return str.trim() == ''
}

function isClearCommand(str) {
    // Test whether the user said (and said only) "clear", "cancel", or "start over".
    return /^(clear|cancel|start over)$/i.test(str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
}

function handleMicPress() {
    recognition.start()
}

function handleMicRelease() {
    document.getElementById('startDictation').classList.add('thinking')
    document.getElementById('startDictation').disabled = true
    recognition.stop()
    console.log('Mic button released.')
}
