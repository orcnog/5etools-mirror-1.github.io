(function () {
    var lastPeerId = null;
    var peer = null; // Own peer object
    var peerId = null;
    var conn = null;
    var recvId = document.getElementById("receiver-id");
    var status = document.getElementById("status");
    var message = document.getElementById("message");
    var standbyBox = document.getElementById("standby");
    var goBox = document.getElementById("go");
    var fadeBox = document.getElementById("fade");
    var offBox = document.getElementById("off");
    var sendMessageBox = document.getElementById("sendMessageBox");
    var sendButton = document.getElementById("sendButton");
    var clearMsgsButton = document.getElementById("clearMsgsButton");      

    function initialize() {
        peer = new Peer(generatePassphrase(), { debug: 2 });
        peer.on('open', function (id) {
            if (peer.id === null) {
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }
            recvId.innerHTML = "ID: " + peer.id;
            status.innerHTML = "Awaiting connection...";
        });
        peer.on('connection', function (c) {
            if (conn && conn.open) {
                c.on('open', function() {
                    c.send("Already connected to another client");
                    setTimeout(function() { c.close(); }, 500);
                });
                return;
            }
            conn = c;
            status.innerHTML = "Connected";
            ready();
        });
        peer.on('disconnected', function () {
            status.innerHTML = "Connection lost. Please reconnect";
            peer.id = lastPeerId;
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
    };

    function ready() {
        conn.on('data', function (data) {
            var cueString = "<span class=\"cueMsg\">Cue: </span>";
            switch (data) {
                case 'Go': go(); addMessage(cueString + data); break;
                case 'Fade': fade(); addMessage(cueString + data); break;
                case 'Off': off(); addMessage(cueString + data); break;
                case 'Reset': reset(); addMessage(cueString + data); break;
                default: addMessage("<span class=\"peerMsg\">Peer: </span>" + data); break;
            };
        });
        conn.on('close', function () {
            status.innerHTML = "Connection reset<br>Awaiting connection...";
            conn = null;
        });
    }

    function go() { changeDisplay("go"); }
    function fade() { changeDisplay("fade"); }
    function off() { changeDisplay("off"); }
    function reset() { changeDisplay("standby"); }

    function changeDisplay(state) {
        standbyBox.className = state === "standby" ? "display-box standby" : "display-box hidden";
        goBox.className = state === "go" ? "display-box go" : "display-box hidden";
        fadeBox.className = state === "fade" ? "display-box fade" : "display-box hidden";
        offBox.className = state === "off" ? "display-box off" : "display-box hidden";
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

    function generatePassphrase() {
        const phraseArray = [
            "sword", "magic", "dragon", "goblin", "jedi", "xwing", "vader", "orc", "drow",
            "yoda", "force", "blaster", "clone", "sith", "saber", "hutt", "ewok", "jabba",
            "elf", "halfling", "ogre", "droid", "storm", "laser", "wand", "dwarf", "base",
            "bow", "blight", "staff", "rogue", "monk", "troop", "tie", "paladin", "boba",
            "bard", "wizard", "wookiee", "pilot", "mando", "padawan", "squire", "griffon",
            "golem", "flame", "kylo", "tank", "knight", "guard", "akbar", "cave", "gravity",
            "creature", "cleric", "speeder", "mandalor", "ghost", "blacksmith", "ranger",
            "jango", "destroyer", "starship", "kyber", "crystal", "hyperspace", "rebel",
            "republic", "fighter", "battle", "dagobah", "tatooine", "solo", "lando", "maul",
            "obiwan", "galaxy", "dagger", "bounty", "armor", "cloak", "phantom", "empire",
            "robin", "light", "c3po", "droids", "redrook", "r2d2", "skywalker", "sidious",
            "luke", "cloud", "captain", "ion", "witch", "rancor", "ice", "coin", "darth",
            "dark", "cannon", "logan", "moon", "pirate", "drake", "copper", "asoka", "jawa",
            "black", "master", "quarren", "bantha", "womprat", "falcon", "harpoon", "sand",
            "bowcaster", "deathstar", "gungan",  "wampa", "shield", "demigod", "spaceport",
            "nerf", "anvil", "hammer", "naboo", "temple", "beastmaster", "clan", "tauntaun",
            "dawn", "siege", "podracer", "realm", "gate", "kessel", "imperial", "scroll",
            "luck", "darkside", "fire", "hunt", "han", "padme", "walker", "gold", "giant",
            "java", "spice", "glaive", "engine", "longbow", "mine", "trap", "silver", "poe",
            "rune", "relic", "fate", "nebulon", "grom", "mimic", "deity", "void", "lion",
            "stone", "grim", "nova", "tome", "helm", "ring", "travel", "wyvern", "druid",
            "crypt", "chest", "rapier", "sorcerer", "guide", "barbarian", "scout", "hoth",
            "kenobi", "star", "sage", "necromancy", "vader", "fireball", "dusk", "rey",
            "blade", "arrow", "mynock", "champion", "trooper", "clan", "steel", "senate",
            "axe", "spectre", "elven", "dwarven", "scar", "mystic", "warlock", "kamino",
            "frost", "alliance", "waterdeep", "longsword", "dantooine", "troll", "potion"
        ];
        const diceTypes = [4, 6, 8, 10, 12, 20]; // Dice types
        const consonants = ['','b','d','f','g','h','j','m','n','p','r','t','v','y','z'];
        console.log(`LENGTH: ${phraseArray.length}`)

        const randomConsonant = consonants[Math.floor(Math.random() * consonants.length)]; // Selects a random consonant from the array
        const randomWord1 = phraseArray[Math.floor(Math.random() * phraseArray.length)]; // Get random word from array
        const randomWord2 = phraseArray[Math.floor(Math.random() * phraseArray.length)]; // Get random word from array
        const randomNumber = Math.floor(Math.random() * 900) + 100; // Generates a random 3-digit integer (100-999)
        const numOfDice = Math.floor(Math.random() * 12) + 1; // Generates a number between 1 and 12
        const diceType = diceTypes[Math.floor(Math.random() * diceTypes.length)]; // Selects a dice type from the array
        const diceNotation = `${numOfDice}d${diceType}`; // Create the dice notation string, ex: 5d12

        return `${randomWord1}-${randomNumber}-${randomWord2}`
    }

    sendMessageBox.addEventListener('keypress', function (e) {
        if (e.which == '13') sendButton.click();
    });

    sendButton.addEventListener('click', function () {
        if (conn && conn.open) {
            var msg = sendMessageBox.value;
            sendMessageBox.value = "";
            conn.send(msg);
            addMessage("<span class=\"selfMsg\">Self: </span>" + msg);
        }
    });

    clearMsgsButton.addEventListener('click', clearMessages);
    initialize();
})();
