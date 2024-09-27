(function () {
    var lastPeerId = null;
    var peer = null; // Own peer object
    var conn = null;
    var recvIdInput = document.getElementById("receiver-id");
    var status = document.getElementById("status");
    var message = document.getElementById("message");
    var goButton = document.getElementById("goButton");
    var resetButton = document.getElementById("resetButton");
    var fadeButton = document.getElementById("fadeButton");
    var offButton = document.getElementById("offButton");
    var sendMessageBox = document.getElementById("sendMessageBox");
    var sendButton = document.getElementById("sendButton");
    var clearMsgsButton = document.getElementById("clearMsgsButton");
    var connectButton = document.getElementById("connect-button");
    var cueString = "<span class=\"cueMsg\">Cue: </span>";

    function initialize() {
        peer = new Peer(null, { debug: 2 });
        peer.on('open', function (id) {
            if (peer.id === null) {
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }
        });
        peer.on('connection', function (c) {
            c.on('open', function() {
                c.send("Sender does not accept incoming connections");
                setTimeout(function() { c.close(); }, 500);
            });
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

    function join() {
        if (conn) { conn.close(); }
        conn = peer.connect(recvIdInput.value, { reliable: true });
        conn.on('open', function () {
            status.innerHTML = "Connected to: " + conn.peer;
        });
        conn.on('data', function (data) {
            addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
        });
        conn.on('close', function () {
            status.innerHTML = "Connection closed";
        });
    };

    function signal(sigName) {
        if (conn && conn.open) {
            conn.send(sigName);
            addMessage(cueString + sigName);
        }
    }

    goButton.addEventListener('click', function () { signal("Go"); });
    resetButton.addEventListener('click', function () { signal("Reset"); });
    fadeButton.addEventListener('click', function () { signal("Fade"); });
    offButton.addEventListener('click', function () { signal("Off"); });

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
    connectButton.addEventListener('click', join);
    initialize();
})();
