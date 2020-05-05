const fs = require("fs");
const GAMESTATES = {
    answering: "answering",
    voting: "voting",
    postround: "postround",
    pregame: "pregame",
};
const PLAYERSTATES = {
    pregame: "pregame",
    nickname: "nickname",
    answering: "answering",
    voting: "voting",
    postround: "postround",
};

class GameCore {
    constructor(gameType, maxPlayers) {
        this._gameType = gameType;
        this._maxPlayers = maxPlayers;
        this._gameState = GAMESTATES.pregame;
        // {<player_id>: {sock: <socket object>, nick: <nickname>}}
        this._players = {};
        // {<player_id>: <score>}
        this._scores = {};
        this._roundNumber = 0;
        this._maxRounds = 5;
        this._roundTimers = [30, 30, 30, 30, 30];
        this._currentRoundTimer = null;
        this._currentTime = null;
        this._answeringEndCheckTimer = null;
        this._nextAvailableId = 1;
        this._gameLeader = null;
        // {<player_id>: <state>}
        this._playerStates = {};
        this._prompts = [];
        this._answers = {};
    }

    _onConnected(sock) {
        console.log("Player connected : Requesting nickname");
        this._requestNickname(sock);
        if (!this._gameLeader) {
            this._gameLeader = {
                id: this._getPlayerIdFromSock(sock),
                sock: sock,
            };
            console.log("Game leader set");
        }
    }

    _onDisconnected(sock) {
        console.log("Player disconnected : Removing player");
        this._removePlayer(sock);
    }

    _removePlayer(sock) {
        let toRemove = [];
        Object.keys(this._players).forEach((id) => {
            if (this._players[id].sock.disconnected) {
                toRemove.push(id);
            }
        });
        toRemove.forEach((id) => {
            delete this._players[id];
            delete this._playerStates[id];
            console.log(`Removed player ${id}`);
        });
        if (Object.keys(this._players).length == 0) {
            console.log("All players left, resetting available ID to 1");
            this._nextAvailableId = 1;
        }
        if (this._gameLeader.sock.disconnected) {
            this._gameLeader = null;
            console.log("Game leader left");
            this._assignNewLeader();
        }
        if (Object.keys(this._players).length > 0) {
            this._updatePreGameScreen();
        }
    }

    _assignNewLeader() {
        if (Object.keys(this._players).length > 0) {
            let plyId = Object.keys(this._players)[0];
            this._gameLeader = { id: plyId, sock: this._players[plyId].sock };
            console.log(`Game leader set to player ${plyId}`);
        }
    }

    // Cycle through each socket and check if the player is in pregame state, if they are, update the screen.
    _updatePreGameScreen() {
        let plyNicks = [];
        let toUpdate = [];
        Object.values(this._players).forEach((ply) => {
            let plyId = this._getPlayerIdFromSock(ply.sock);
            if (this._playerStates[plyId] == PLAYERSTATES.pregame) {
                plyNicks.push(ply.nick);
                toUpdate.push(ply.sock);
            }
        });
        let plyInfo = {
            players: plyNicks,
            leader: this._gameLeader.id,
            maxplayers: this._maxPlayers,
        };
        toUpdate.forEach((sock) => {
            sock.emit("pregame", plyInfo);
        });
    }

    _getPlayerIdFromSock(sock) {
        return Object.keys(this._players).find(
            (key) => this._players[key].sock == sock
        );
    }

    _requestNickname(sock) {
        let id = this._assignId(sock);
        this._playerStates[id] = PLAYERSTATES.nickname;
        sock.emit("nickname", id);
        return;
    }

    _setNickname(nickObject) {
        this._players[nickObject.id].nick = nickObject.nick;
        console.log(
            `Setting player ${nickObject.id}'s nickname to "${nickObject.nick}"`
        );
        this._playerStates[nickObject.id] = PLAYERSTATES.pregame;
    }

    _assignId(sock) {
        console.log(`Assigning ID ${this._nextAvailableId}`);
        this._players[this._nextAvailableId] = { sock: sock, nick: null };
        this._nextAvailableId++;
        return this._nextAvailableId - 1;
    }

    _startGame(id, io) {
        // Check the leader sent the start game request
        if (id != this._gameLeader.id) {
            return false;
        }
        console.log("Starting a new game");
        this._roundNumber = 1;
        this._newRound(io);
    }

    _preload() {
        let promptsFilePath = "./quiplash_prompts.txt";
        let promptsRaw = fs.readFileSync(promptsFilePath);
        this._prompts = JSON.parse(promptsRaw);
    }

    _chooseRandomPrompt() {
        return this._prompts[Math.floor(Math.random() * this._prompts.length)]
            .prompt;
    }

    _newRound(io) {
        this._gameState = GAMESTATES.answering;
        Object.keys(this._playerStates).forEach((id) => {
            this._playerStates[id] = PLAYERSTATES.answering;
        });
        let roundPrompt = this._chooseRandomPrompt();
        this._currentTime = this._roundTimers[this._roundNumber - 1];
        let roundInfo = {
            time: this._currentTime,
            prompt: roundPrompt,
        };
        io.emit("roundstart", roundInfo);
        // Start the round timer and tick it down each second
        this._currentRoundTimer = setInterval(() => {
            this._timerTick(io);
        }, 1000);
    }

    _answeringEnd(io) {
        this._gameState = GAMESTATES.voting;
        clearInterval(this._currentRoundTimer);
        io.emit("answeringend", "answeringend");
        this._answeringEndCheckTimer = setTimeout(() => {
            this._answeringEndCheckEnd(false);
        }, 5000);
    }

    _answeringEndCheckEnd(prechecked) {
        if (!prechecked) {
            let slowPlayers = [];
            let checkCounter = 0;
            Object.values(this._playerStates).forEach((state) => {
                if (state != PLAYERSTATES.voting) {
                    slowPlayers.push(
                        Object.keys(this._playerStates)[checkCounter]
                    );
                }
                checkCounter += 1;
            });
            slowPlayers.forEach((id) => {
                this._players[id].sock.disconnect();
            });
        }
        this._votingPhase();
    }

    _timerTick(io) {
        this._currentTime -= 1;
        if (this._currentTime <= 0) {
            this._answeringEnd(io);
        }
    }

    _timerRequest(sock) {
        sock.emit("timercheck", this._currentTime);
    }

    _answeringEndResponse(id) {
        if (this._gameState == GAMESTATES.voting) {
            this._playerStates[id] = PLAYERSTATES.voting;
            let allPlayersAnsweringEnd = true;
            Object.values(this._playerStates).forEach((state) => {
                if (state != PLAYERSTATES.voting) {
                    allPlayersAnsweringEnd = false;
                }
            });
            if (allPlayersAnsweringEnd) {
                clearTimeout(this._answeringEndCheckTimer);
                this._answeringEndCheckEnd(true);
            }
        }
    }

    _votingPhase() {
        console.log("Voting starting");
    }

    _postRound() {
        console.log("Post round starting");
    }
}

module.exports = GameCore;
