const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const RpsGame = require("./rps-game");

const app = express();

const PORT = process.env.PORT || 8080;

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`)

// Used to show which file(s) the client should access when it connects
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

let waitingPlayer = null;

io.on("connection", (sock) => {
    console.log("IO Connection");
    if (waitingPlayer) {
        // start a game
        new RpsGame(waitingPlayer, sock);
        waitingPlayer = null;
    } else {
        waitingPlayer = sock;
        waitingPlayer.emit("message", "Waiting for an opponent");
    }

    // sock.emit only sends to single client who has connected
    // io.emit sends to all connected clients

    sock.on("message", (text) => {
        io.emit("message", text);
    });
})

// Check if the server crashes and print the error
server.on("error", (err) => {
    console.error("Server error: ", err);
})

server.listen(PORT, () => {
    console.log(`RPS started on ${PORT}`);
})