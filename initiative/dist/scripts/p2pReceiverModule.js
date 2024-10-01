let lastPeerId = null;
let peer = null; // Own peer object
let connections = [];
let dataCallback = null; // Placeholder for the external data handler
let controller = null;
let controllerCallback = null; // Placeholder for the external control-connection callback

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
        // Add the new connection to the array of connections
        connections.push(c);
        console.log(`Connection established with peer: ${c.peer}`);
        updateConnectionStatus(connections);

        // Check if the connection is from the controller
        if (c.label === 'CONTROLLER') {
            controller = c;
            // Use external controller-connect callback, if provided
            if (typeof controllerCallback === 'function') {
                controllerCallback(c);
            }
        }

        // Call the ready function for each new connection
        ready(c);
    });
    peer.on('disconnected', function () {
        status.innerHTML = "Connection lost. Please reconnect";
        // peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        status.innerHTML = "Connection destroyed. Please refresh";
    });
    peer.on('error', function (err) {
        alert('Error: ' + err);
    });
    makeCopiable(recvId);
};

function updateConnectionStatus(connections) {
    const controllerConnection = connections.find(conn => conn.label === 'CONTROLLER');
    const peerCount = connections.length;

    if (controllerConnection && peerCount === 1) {
        status.innerHTML = "Connected to controller.";
    } else if (controllerConnection && peerCount > 1) {
        const otherPeerCount = peerCount - 1; // Subtract 1 for the controller
        status.innerHTML = `Connected to controller plus ${otherPeerCount} peer${otherPeerCount > 1 ? 's' : ''}.`;
    } else if (!controllerConnection && peerCount > 0) {
        status.innerHTML = `Connected to ${peerCount} peer${peerCount > 1 ? 's' : ''}.`;
    } else {
        status.innerHTML = "No connections.";
    }
}

function ready(conn) {
    // When data is received...
    conn.on('data', function (data) {
        // Handle data or use external callback if provided
        if (typeof dataCallback === 'function') {
            dataCallback(data, conn.peer); // Pass peer ID for tracking
        }
        addMessage(`Peer ${conn.peer}: ${data}`);
    });

    conn.on('close', function () {
        status.innerHTML = `Connection with peer ${conn.peer} closed. ${connections.length - 1} remaining`;
        connections = connections.filter(c => c !== conn); // Remove closed connection
    });
}

function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());
    const formattedTime = h > 12 ? h - 12 : h === 0 ? 12 : h;
    
    function addZero(t) { return t < 10 ? "0" + t : t; }
    
    message.innerHTML = `<br><span class="msg-time">${formattedTime}:${m}:${s}</span> - ${msg}` + message.innerHTML;
}

function clearMessages() {
    message.innerHTML = "";
    addMessage("Msgs cleared");
}

export function resetPeerConnection() {
    // Close all existing connections
    connections.forEach(conn => conn.close());
    connections = [];

    if (peer) {
        peer.destroy();
    }

    status.innerHTML = "Connection reset.";

    setTimeout(() => {
        initialize();
    }, 600);
}

function generatePassphrase() {
    const phraseArray = [
        "sword", "magic", "dragon", "goblin", "jedi", "x-wing", "vader", "orc", "drow",
        "yoda", "force", "blaster", "clone", "sith", "saber", "hutt", "ewok", "jabba",
        "elf", "halfling", "ogre", "droid", "admiral", "laser", "wand", "dwarf", "base",
        "bow", "blight", "staff", "rogue", "monk", "troop", "tie", "paladin", "boba",
        "bard", "wizard", "wookiee", "pilot", "mando", "padawan", "squire", "griffon",
        "golem", "flame", "kylo", "tank", "knight", "guard", "akbar", "cave", "gravity",
        "creature", "cleric", "speeder", "mandalor", "ghost", "blacksmith", "ranger",
        "jango", "destroyer", "starship", "kyber", "inquisitor", "hyperspace", "rebel",
        "republic", "fighter", "battle", "dagobah", "tatooine", "solo", "lando", "maul",
        "obi-wan", "galaxy", "dagger", "bounty", "armor", "cloak", "phantom", "empire",
        "robin", "light", "c3po", "droids", "redrook", "r2d2", "skywalker", "sidious",
        "luke", "coruscant", "captain", "ion", "witch", "rancor", "platemail", "coin", "darth",
        "dark", "cannon", "chainmail", "moon", "y-wing", "drake", "copper", "asoka", "jawa",
        "black", "master", "quarren", "bantha", "womprat", "falcon", "harpoon", "splint",
        "bowcaster", "deathstar", "gungan",  "wampa", "shield", "demigod", "spaceport",
        "nerf", "anvil", "hammer", "naboo", "temple", "pilot", "icewind", "tauntaun", "grim",
        "dawn", "siege", "podracer", "realm", "gate", "kessel", "imperial", "scroll", "sigil",
        "sabacc", "darkside", "fire", "hunt", "han", "padme", "walker", "gold", "giant",
        "qui-gon", "spice", "glaive", "engine", "longbow", "mine", "trap", "silver", "poe",
        "rune", "relic", "turbo", "nebulon", "grom", "mimic", "deity", "void", "youngling",
        "stone", "wookie", "nova", "tome", "helm", "ring", "travel", "wyvern", "druid",
        "crypt", "chest", "rapier", "sorcerer", "health-potion", "barbarian", "scout", "hoth",
        "kenobi", "star", "sage", "necromancer", "vader", "fireball", "goblet", "anakin",
        "blade", "arrow", "mynock", "champion", "trooper", "clan", "steel", "senate", "leia",
        "axe", "spectre", "elven", "dwarven", "scarif", "arcana", "warlock", "kamino", "orb",
        "frost", "alliance", "waterdeep", "longsword", "neverwinter", "troll", "potion",
        "organa", "windu", "mace", "dooku", "grievous", "palpatine", "tarkin", "order-66",
        "sarlacc", "parsec", "millenium-falcon", "stormtrooper", "andor", "bespin", "yavin",
        "bronze", "adamantine", "construct", "sector", "shortbow", "crossbow", "soldier",
        "daggerford", "triboar", "baldurs-gate", "half-elf", "tiefling", "elemental", "rey",
        "mithril", "shortsword", "eldritch", "lich", "underdark", "beholder", "mindflayer",
        "kobold", "hobgoblin", "bugbear", "gnome", "steed", "undead", "warrior", "kraken",
        "planeswalker", "amulet", "greatsword", "greataxe", "scimitar", "plastoid", "relic",
        "chalice", "ethereal", "fey", "shadowfell", "archmage", "vorpal", "astral", "gemstone"

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

// Send message to all connected peers
sendButton?.addEventListener('click', function () {
    if (connections.length > 0) {
        const msg = sendMessageBox.value;
        sendMessageBox.value = "";
        
        // Send message to all connections
        connections.forEach(conn => {
            if (conn.open) {
                conn.send(msg);
                addMessage(`<span class="selfMsg">Self: </span>${msg}`);
            }
        });
    } else {
        console.error('No connections available');
    }
});

sendMessageBox?.addEventListener('keypress', function (e) {
    if (e.key == 'Enter') sendButton.click();
});

clearMsgsButton?.addEventListener('click', clearMessages);

resetButton?.addEventListener('click', resetPeerConnection);

// Set external data handler
export function onData(callback) {
    dataCallback = callback; // Assign the callback provided by the external module
}

// Export the controller connection
export { controller };
export function onControllerConnection(callback) {
    controllerCallback = callback; // Assign the callback provided by the external module
}