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
    }

    _onConnected(sock) {
        console.log("Player connected : Requesting nickname");
        this._requestNickname(sock);
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
            console.log(`Removed player ${id}`);
        });
    }

    _requestNickname(sock) {
        let id = this._assignId(sock);
        sock.emit("nickname", id);
    }

    _setNickname(nickObject) {
        this._players[nickObject.id].nick = nickObject.nick;
        console.log(
            `Setting player ${nickObject.id}'s nickname to "${nickObject.nick}"`
        );
    }

    _assignId(sock) {
        console.log(`Assigning ID ${this._nextAvailableId}`);
        this._players[this._nextAvailableId] = { sock: sock, nick: null };
        this._nextAvailableId++;
        return this._nextAvailableId - 1;
    }
}

module.exports = GameCore;
