class GameCore {
    constructor(gameType, maxPlayers) {
        this._gameType = gameType;
        this._maxPlayers = maxPlayers;
        // {<player_id>: {sock: <socket object>, nick: <nickname>}}
        this._players = {};
        // {<player_id>: <score>}
        this._scores = {};
        this._roundNumber = 0;
        this._nextAvailableId = 1;
        this._gameLeader = null;
        // {<player_id>: <state>}
        this._playerStates = {};
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
        this._updatePreGameScreen();
        if (this._gameLeader.sock.disconnected) {
            this._gameLeader = null;
            console.log("Game leader left");
            this._assignNewLeader();
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
            if (this._playerStates[plyId] == "pregame") {
                plyNicks.push(ply.nick);
                toUpdate.push(ply.sock);
            }
        });
        let plyInfo = { players: plyNicks, leader: this._gameLeader.id };
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
        this._playerStates[id] = "nickname";
        sock.emit("nickname", id);
        return;
    }

    _setNickname(nickObject) {
        this._players[nickObject.id].nick = nickObject.nick;
        console.log(
            `Setting player ${nickObject.id}'s nickname to "${nickObject.nick}"`
        );
        this._playerStates[nickObject.id] = "pregame";
    }

    _assignId(sock) {
        console.log(`Assigning ID ${this._nextAvailableId}`);
        this._players[this._nextAvailableId] = { sock: sock, nick: null };
        this._nextAvailableId++;
        return this._nextAvailableId - 1;
    }
}

module.exports = GameCore;
