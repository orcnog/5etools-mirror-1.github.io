var send;
(function () {
    var lastPeerId = null;
    var peer = null; // Own peer object
    var conn = null;
    var recvIdInput = document.getElementById("receiver-id");
    var status = document.getElementById("status");
    var message = document.getElementById("message");
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
        recvIdInput.focus()
    };

    function join() {
        if (conn) { conn.close(); }
        conn = peer.connect(recvIdInput.value, { label: 'CONTROLLER', reliable: true });
        conn.on('open', function () {
            status.innerHTML = "Connected to: " + conn.peer;
        });
        conn.on('data', function (data) {
            if (typeof data === 'object') {
                handleDataObject(data);
            } else {
                addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
            }
        });
        conn.on('close', function () {
            status.innerHTML = "Connection closed";
        });
    };

    signal = function (sigName) {
        if (conn && conn.open) {
            conn.send(sigName);
            addMessage(cueString + sigName);
        } else {
            console.error('No connection found.');
            alert('No connection found.');
        }
    }

    async function handleDataObject(data) {
        if (data.controllerData) {
            const obj = data.controllerData;
            if (obj.hasOwnProperty('currentTheme')) document.getElementById('updateTheme').value = obj.currentTheme;
            if (obj.hasOwnProperty('slideshowConfig')) {
                await createRadioButtons('go_to_slide', 'goToSlideGroup', obj.slideshowConfig);
            }
            if (obj.hasOwnProperty('currentSlideshowId')) {
                document.getElementById('updateSlideshowContext').value = obj.currentSlideshowId;
            }
            if (obj.hasOwnProperty('currentSlideNum') && typeof obj.currentSlideNum === 'number') {
                // Find the radio button with the value equal to obj.currentSlideNum
                const radioToCheck = document.querySelector(`input[name="goToSlideGroup"][value="${obj.currentSlideNum}"]`);
                
                if (radioToCheck) {
                    // Set the radio button as checked
                    radioToCheck.checked = true;
                }
                if (obj.currentSlideNum > 0) {
                    document.getElementById('back_to_initiative').classList.remove('active');
                    document.getElementById('go_to_slide').classList.add('active');
                }
            }
            if (obj.hasOwnProperty('initiativeActive') && obj.initiativeActive === true) {
                document.getElementById('back_to_initiative').classList.add('active');
                document.getElementById('go_to_slide').classList.remove('active');
            }
            if (obj.hasOwnProperty('currentPlayers')) {
                // Assuming obj.currentPlayers is your JSON array
                const players = obj.currentPlayers;

                const table = document.getElementById('initiative_order').querySelector('table');

                // Clear the table before inserting new rows
                table.innerHTML = '';

                // Loop through each player and create a row
                players.forEach(player => {
                    // Create a new row
                    const row = document.createElement('tr');

                    // Create and append the "name" cell
                    const nameCell = document.createElement('td');
                    nameCell.textContent = player.name;
                    row.appendChild(nameCell);

                    // Create and append the "order" cell
                    const orderCell = document.createElement('td');
                    orderCell.textContent = player.order;
                    row.appendChild(orderCell);

                    // Create and append the "badge" cell (if it exists)
                    const badgeCell = document.createElement('td');
                    badgeCell.textContent = player.badge || '-'; // Show a dash if no badge
                    row.appendChild(badgeCell);

                    // Create and append the "status" cell (for dead/bloodied)
                    const statusCell = document.createElement('td');
                    if (player.dead) {
                        statusCell.textContent = 'Dead';
                    } else if (player.bloodied) {
                        statusCell.textContent = 'Bloodied';
                    } else {
                        statusCell.textContent = 'Healthy';
                    }
                    row.appendChild(statusCell);

                    // Append the row to the table
                    table.appendChild(row);
                });
            }
        }
    }

    async function createRadioButtons(containerId, groupName, slideshowConfig) {
        if (!slideshowConfig) return false;
        const container = document.getElementById(containerId);
        const totalSlides = slideshowConfig.scenes?.length;
        container.innerHTML = ''; // Clear previous radio buttons
    
        for (let i = 1; i <= totalSlides; i++) {
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.id = `${groupName}_${i}`;
            radioInput.name = groupName;
            radioInput.value = i;
    
            // Add the click event listener to the radio input
            radioInput.onclick = function(event) {
                signal(containerId + ':' + event.target.value);
            };
    
            const radioLabel = document.createElement('label');
            radioLabel.htmlFor = radioInput.id;
            radioLabel.textContent = i;
            radioLabel.classList.add('radio-button');
    
            // Check if the slideshowConfig contains images, and set the background-image
            if (slideshowConfig.scenes[i - 1]) {
                let imageUrl;
                const fromTop = slideshowConfig.scenes[i - 1]?.focalPointDistanceFromTop ?? '50%';
                const fromLeft = slideshowConfig.scenes[i - 1]?.focalPointDistanceFromLeft ?? '50%';
                let title;
                if (slideshowConfig.scenes[i - 1].image) {
                    imageUrl = `../${slideshowConfig.scenes[i - 1].image}`;
                } else if (slideshowConfig.scenes[i - 1].url) {
                    const url = slideshowConfig.scenes[i - 1].url;
                    const response = await fetch('../' + url);
                    const htmlString = await response.text(); // Get HTML as text

                    // Create a temporary DOM element to parse the HTML string
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlString;

                    // Check if there is an <img> tag in the parsed HTML
                    if (tempDiv.querySelector('.slideshow-content img')) {
                        imageUrl = `../${tempDiv.querySelector('img').getAttribute('src')}`;
                        console.log('Image URL:', imageUrl);
                    }
                }
                if (slideshowConfig.scenes[i - 1].caption) {
                    title = slideshowConfig.scenes[i - 1].caption;
                    if (slideshowConfig.scenes[i - 1].subcap) {
                        title += `\n${slideshowConfig.scenes[i - 1].subcap}`
                    }
                }
                radioLabel.style.backgroundImage = `url("${imageUrl}")`;
                radioLabel.style.backgroundSize = 'cover';
                radioLabel.style.backgroundPosition = `${fromLeft} ${fromTop}`;
                if (title) radioLabel.title = title;
            }
    
            container.appendChild(radioInput);
            container.appendChild(radioLabel);
        }
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

    sendMessageBox.addEventListener('keypress', function (e) {
        if (e.key == 'Enter') sendButton.click();
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
    recvIdInput.addEventListener('keypress', function (e) {
        if (e.key == 'Enter') connectButton.click();
    });
    initialize();
})();

