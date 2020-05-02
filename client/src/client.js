const checkStatus = (status) => {};

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

let playerid = -1;
const sock = io();
sock.on("status", checkStatus);
sock.on("nickname", requestNickname);
sock.on("pregame", preGameScreen);
