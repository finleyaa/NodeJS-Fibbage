const requestNickname = (id) => {
    playerid = id;
    console.log(playerid);
    document.body.innerHTML = "";
    console.log("Nickname requested by server");
    let nickWrapper = document.createElement("div");
    nickWrapper.id = "nickname-wrapper";
    let nickHeader = document.createElement("p");
    nickHeader.id = "nickname-header";
    nickHeader.innerHTML = "Welcome to Quiplash!";
    let nickForm = document.createElement("form");
    nickForm.id = "nickname-form";
    nickForm.addEventListener("submit", nickFormSubmitted);
    let textBox = document.createElement("input");
    textBox.id = "nickname-input";
    textBox.placeholder = "Nickname";
    let submit = document.createElement("button");
    submit.innerText = "Set nickname";
    submit.id = "nickname-submit";

    nickForm.appendChild(textBox);
    nickForm.appendChild(submit);
    nickWrapper.appendChild(nickHeader);
    nickWrapper.appendChild(nickForm);
    document.body.appendChild(nickWrapper);
};

const nickFormSubmitted = (e) => {
    e.preventDefault();
    let nickname = {
        id: playerid,
        nick: document.getElementById("nickname-input").value,
    };
    sock.emit("nickname", nickname);
    let nickForm = document.getElementById("nickname-form");
    nickForm.remove();
};

const preGameScreen = (preGameInfo) => {
    let players = preGameInfo.players;
    let leader = preGameInfo.leader;
    document.body.innerHTML = "";
    // Display all connected players (images and nicknames)
    let waitingHeader = document.createElement("p");
    waitingHeader.innerHTML = "Waiting for leader to start...";
    waitingHeader.id = "pregame-header";
    let plyWrapper = document.createElement("div");
    plyWrapper.id = "ply-wrapper";
    players.forEach((ply) => {
        let plyDiv = document.createElement("div");
        plyDiv.className = "ply-div";
        let plyNick = document.createElement("p");
        plyNick.innerHTML = ply;
        plyNick.className = "ply-nick";
        plyDiv.appendChild(plyNick);
        plyWrapper.appendChild(plyDiv);
    });
    let amountConnect = document.createElement("p");
    amountConnect.id = "pregame-connected";
    amountConnect.innerHTML = `${players.length}/${preGameInfo.maxplayers} players connected`;
    document.body.appendChild(waitingHeader);
    document.body.appendChild(plyWrapper);
    document.body.appendChild(amountConnect);
    if (leader == playerid) {
        // Display start game button
        if (players.length >= 4) {
            let startGameForm = document.createElement("form");
            startGameForm.id = "startgame-form";
            let startGameButton = document.createElement("button");
            startGameButton.id = "startgame-submit";
            startGameButton.innerHTML = "Start game";
            startGameForm.addEventListener("submit", startGame);
            startGameForm.appendChild(startGameButton);
            document.body.appendChild(startGameForm);
        } else {
            let morePlayers = document.createElement("p");
            morePlayers.id = "moreplayers-footer";
            morePlayers.innerHTML = "Need at least 4 players to start a game";
            document.body.appendChild(morePlayers);
        }
    }
};

const startGame = (e) => {
    e.preventDefault();
    sock.emit("startgame", playerid);
};

const roundStart = (roundInfo) => {
    roundState = ROUNDSTATES.answering;
    // Display prompt and answer box with timer
    // set a timer to request time from server every 5 seconds
    document.body.innerHTML = "";
    let roundTimer = document.createElement("p");
    roundTimer.innerHTML = roundInfo.time;
    roundTimer.id = "round-timer";
    document.body.appendChild(roundTimer);
    currentRoundTimer = setInterval(timerTick, 1000);
    checkTimer = setInterval(checkServerTimer, checkServerTimerInterval);
    sock.emit("roundstart", playerid);
};

const timerTick = () => {
    let roundTimer = document.getElementById("round-timer");
    let currentTime = parseInt(roundTimer.innerHTML);
    roundTimer.innerHTML = currentTime - 1;
    if (currentTime - 1 <= 0) {
        answeringEnd();
    }
};

const checkServerTimer = () => {
    sock.emit("timercheck", "timercheck");
    console.log("Server timer request");
};

const serverTimerResponse = (time) => {
    let roundTimer = document.getElementById("round-timer");
    let clientTime = parseInt(roundTimer.innerHTML);
    console.log(`Time drift: ${clientTime - time}`);
    roundTimer.innerHTML = time;
};

const answeringEnd = () => {
    roundState = ROUNDSTATES.voting;
    clearInterval(currentRoundTimer);
    clearInterval(checkTimer);
    currentRoundTimer = null;
    checkTimer = null;
};

const checkAnsweringEnd = () => {
    if ((roundState = ROUNDSTATES.Answering)) {
        answeringEnd();
        console.log("Answering ended by server");
    }
    sock.emit("answeringend", playerid);
    // WAITING FOR RESULTS SCREEN HTML & CSS
};

const checkServerTimerInterval = 5000; // Time delay between checking the server timer

const ROUNDSTATES = {
    answering: "answering",
    voting: "voting",
    postround: "postround",
};

let roundState = null;
let checkTimer = null;
let currentRoundTimer = null;

let playerid = -1;

const sock = io();
sock.on("nickname", requestNickname); // Nickname request from server
sock.on("pregame", preGameScreen); // Pregame request from server
sock.on("roundstart", roundStart); // Start round request from server
sock.on("timercheck", serverTimerResponse); // Response from the server when a client request the server time
sock.on("answeringend", checkAnsweringEnd); // Server will check that the answering phase has been ended based on the server timer
