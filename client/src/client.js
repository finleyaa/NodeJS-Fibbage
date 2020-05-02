const checkStatus = (status) => {};

const requestNickname = (id) => {
    playerid = id;
    console.log(playerid);
    document.body.innerHTML = "";
    console.log("Nickname requested by server");
    let nickForm = document.createElement("form");
    nickForm.id = "nickname-form";
    nickForm.addEventListener("submit", nickFormSubmitted);
    let textBox = document.createElement("input");
    textBox.id = "nickname-input";
    textBox.placeholder = "Nickname";
    let submit = document.createElement("button");
    submit.innerText = "Set Nickname";
    submit.id = "nickname-submit";

    nickForm.appendChild(textBox);
    nickForm.appendChild(submit);
    document.body.appendChild(nickForm);
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
    if (leader) {
        // Display start game button
    }
    // Display all connected players (images and nicknames)
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
    document.body.appendChild(plyWrapper);
};

let playerid = -1;
const sock = io();
sock.on("status", checkStatus);
sock.on("nickname", requestNickname);
sock.on("pregame", preGameScreen);
