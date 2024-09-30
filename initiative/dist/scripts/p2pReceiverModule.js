let lastPeerId = null;
let peer = null; // Own peer object
let conn = null;
let connections = [];
let dataCallback = null; // Placeholder for the external data handler

// DOM elements
const recvId = document.getElementById("p2p-receiver-id");
const status = document.getElementById("p2p-receiver-status");
const message = document.getElementById("message");
const sendMessageBox = document.getElementById("sendMessageBox");
const sendButton = document.getElementById("sendButton");
const clearMsgsButton = document.getElementById("clearMsgsButton");      
const resetButton = document.getElementById('p2p-reset-button');

export function initialize() {
    peer = new Peer(generatePassphrase(), { debug: 2 });
    peer.on('open', function (id) {
        if (peer.id === null) {
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }
        recvId.innerHTML = peer.id;
        status.innerHTML = "Awaiting connection...";
    });
    peer.on('connection', c => {
        if (conn && conn.open) {
            c.on('open', function() {
                c.send("Already connected to another client");
                //setTimeout(function() { c.close(); }, 500);
            });
            return;
        }
        connections.push(c)
        conn = c;
        status.innerHTML = "Connected";
        ready();
    });
    peer.on('disconnected', function () {
        status.innerHTML = "Connection lost. Please reconnect";
        // peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        status.innerHTML = "Connection destroyed. Please refresh";
    });
    peer.on('error', function (err) {
        alert('' + err);
    });
    makeCopiable(recvId);
};

function ready() {
    conn.on('data', function (data) {
        // Handle internal logic or let the external callback handle the data
        if (dataCallback) {
            dataCallback(data); // Call the external callback
        }
    });
    conn.on('close', function () {
        status.innerHTML = "Connection reset<br>Awaiting connection...";
        conn = null;
    });
}

function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());
    if (h > 12) h -= 12; else if (h === 0) h = 12;
    function addZero(t) { if (t < 10) t = "0" + t; return t; };
    message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
}

function clearMessages() {
    message.innerHTML = "";
    addMessage("Msgs cleared");
}

export function resetPeerConnection() {
    // Close the current connection if it exists
    if (conn) {
        conn.close();
        conn = null;
    }

    // Destroy the current peer connection
    if (peer) {
        peer.destroy();
    }

    status.innerHTML = "Connection reset.";

    setTimeout(()=>{
        // Re-initialize a new peer connection with a new ID
        initialize(); 
    }, 600);
}

function generatePassphrase() {
    const phraseArray = [
        "sword", "magic", "dragon", "goblin", "jedi", "xwing", "vader", "orc", "drow",
        "yoda", "force", "blaster", "clone", "sith", "saber", "hutt", "ewok", "jabba",
        "elf", "halfling", "ogre", "droid", "admiral", "laser", "wand", "dwarf", "base",
        "bow", "blight", "staff", "rogue", "monk", "troop", "tie", "paladin", "boba",
        "bard", "wizard", "wookiee", "pilot", "mando", "padawan", "squire", "griffon",
        "golem", "flame", "kylo", "tank", "knight", "guard", "akbar", "cave", "gravity",
        "creature", "cleric", "speeder", "mandalor", "ghost", "blacksmith", "ranger",
        "jango", "destroyer", "starship", "kyber", "inquisitor", "hyperspace", "rebel",
        "republic", "fighter", "battle", "dagobah", "tatooine", "solo", "lando", "maul",
        "obiwan", "galaxy", "dagger", "bounty", "armor", "cloak", "phantom", "empire",
        "robin", "light", "c3po", "droids", "redrook", "r2d2", "skywalker", "sidious",
        "luke", "coruscant", "captain", "ion", "witch", "rancor", "ice", "coin", "darth",
        "dark", "cannon", "logan", "moon", "pirate", "drake", "copper", "asoka", "jawa",
        "black", "master", "quarren", "bantha", "womprat", "falcon", "harpoon", "sand",
        "bowcaster", "deathstar", "gungan",  "wampa", "shield", "demigod", "spaceport",
        "nerf", "anvil", "hammer", "naboo", "temple", "beastmaster", "clan", "tauntaun",
        "dawn", "siege", "podracer", "realm", "gate", "kessel", "imperial", "scroll",
        "luck", "darkside", "fire", "hunt", "han", "padme", "walker", "gold", "giant",
        "java", "spice", "glaive", "engine", "longbow", "mine", "trap", "silver", "poe",
        "rune", "relic", "turbo", "nebulon", "grom", "mimic", "deity", "void", "lion",
        "stone", "grim", "nova", "tome", "helm", "ring", "travel", "wyvern", "druid",
        "crypt", "chest", "rapier", "sorcerer", "guide", "barbarian", "scout", "hoth",
        "kenobi", "star", "sage", "necromancer", "vader", "fireball", "dusk", "rey",
        "blade", "arrow", "mynock", "champion", "trooper", "clan", "steel", "senate",
        "axe", "spectre", "elven", "dwarven", "scarif", "arcana", "warlock", "kamino",
        "frost", "alliance", "waterdeep", "longsword", "neverwinter", "troll", "potion",
        "organa", "leia", "windu", "mace", "dooku", "grievous", "palpatine", "tarkin",
        "sarlacc", "parsec", "millenium-falcon", "stormtrooper", "andor", "bespin"
    ];
    const diceTypes = [4, 6, 8, 10, 12, 20]; // Dice types
    const consonants = ['','b','d','f','g','h','j','m','n','p','r','t','v','y','z'];

    const randomConsonant = consonants[Math.floor(Math.random() * consonants.length)]; // Selects a random consonant from the array
    const randomWord1 = phraseArray[Math.floor(Math.random() * phraseArray.length)]; // Get random word from array
    const randomWord2 = phraseArray[Math.floor(Math.random() * phraseArray.length)]; // Get random word from array
    const randomNumber = Math.floor(Math.random() * 900) + 100; // Generates a random 3-digit integer (100-999)
    const numOfDice = Math.floor(Math.random() * 12) + 1; // Generates a number between 1 and 12
    const diceType = diceTypes[Math.floor(Math.random() * diceTypes.length)]; // Selects a dice type from the array
    const diceNotation = `${numOfDice}d${diceType}`; // Create the dice notation string, ex: 5d12

    return `orcnog-${randomNumber}-${randomWord1}-${randomWord2}`
}

function makeCopiable(elem) {
    if (elem) {
        elem.style.cursor = "pointer";
        elem.addEventListener("click", copyTextToClipboard);
    }
}

// Function to copy the span's text content to the clipboard
function copyTextToClipboard(e) {
    // Get the text from the span
    const textToCopy = e.target.textContent;
    
    // Use the Clipboard API to write the text to the clipboard
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            // Optionally notify the user that the text was copied
            console.log('Text copied to clipboard:', textToCopy);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}    

sendMessageBox?.addEventListener('keypress', function (e) {
    if (e.key == 'Enter') sendButton.click();
});

sendButton?.addEventListener('click', function () {
    if (conn && conn.open) {
        var msg = sendMessageBox.value;
        sendMessageBox.value = "";
        conn.send(msg);
        addMessage("<span class=\"selfMsg\">Self: </span>" + msg);
    } else {
        console.error('Connection not found')
    }
});

clearMsgsButton?.addEventListener('click', clearMessages);

resetButton?.addEventListener('click', resetPeerConnection);

// Function to set the external data handler
export function onData(callback) {
    dataCallback = callback; // Assign the callback provided by the external module
}
