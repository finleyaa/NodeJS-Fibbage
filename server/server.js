const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const GameCore = require("./gamecore");
const GAMETYPE = "quiplash";
const MAXPLAYERS = 10;

const app = express();

const PORT = process.env.PORT || 8080;

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

// Used to show which file(s) the client should access when it connects
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);
let currentGame = new GameCore(GAMETYPE, MAXPLAYERS);

io.on("connection", (sock) => {
    currentGame._onConnected(sock);
    sock.on("disconnect", () => {
        currentGame._onDisconnected(sock);
    });

    sock.on("nickname", (nickObject) => {
        currentGame._setNickname(nickObject);
        currentGame._updatePreGameScreen(io);
    });
});

// Check if the server crashes and print the error
server.on("error", (err) => {
    console.error("Server error: ", err);
});

server.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
