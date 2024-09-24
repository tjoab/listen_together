const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "*", // CORS for websocket
	},
});

let numUsers = 0;
let numUsersReady = 0;

app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

io.on("connection", (socket) => {
	console.log("A user connected");
	numUsers += 1;

	if (numUsers == 2) {
		console.log("2 users have connected, not yet ready.");
		io.emit("usersConnected");
	}

	socket.on("userReady", () => {
		console.log("A user has ready-ed up.");
		numUsersReady += 1;

		if (numUsersReady == 2) {
			console.log("All users are ready.");
			io.emit("allReady");
		}
	});

	// Broadcast play event
	socket.on("play", () => {
		console.log("Playing track.");
		socket.broadcast.emit("play");
	});

	// Broadcast pause event
	socket.on("pause", () => {
		console.log("Pausing track.");
		socket.broadcast.emit("pause");
	});

	// Broadcast seek event
	socket.on("seek", (currentTime) => {
		console.log(`Seeking to ${currentTime}.`);
		socket.broadcast.emit("seek", currentTime);
	});

	socket.on("disconnect", () => {
		console.log("A user disconnected");
		numUsers -= 1;
		// Assuming that no user disconnects before ready-ing up.
		numUsersReady -= 1;
		if (numUsers != 2) {
			io.emit("usersDisconnected", false);
		}
		if (numUsers == 0) {
			numUsersReady = 0;
		}
	});
});

// Export the server handler
module.exports = (req, res) => {
	server.emit("request", req, res);
};
