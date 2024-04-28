// Importing the required modules
const WebSocketServer = require('ws');
let Utils = require("../utils.js");

let clients = new Set();

// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: Utils.WS_PORT })

wss.on("connection", (clientWebSocket) => {
	Utils.log("New client connected");

	clients.add(clientWebSocket);

	//on message from client
	clientWebSocket.on("message", (data, isBinary) => {
		const message = isBinary ? data : JSON.parse(data.toString());
		Utils.log("Client has sent us: ", message)

		//test
		if (message.eventName === "test") {
			for (let client of clients) {
				client.send("Test a fonctionné :)");
			}

			return;
		}


		//When someone refresh hios profile picture
		if (message.eventName === "refreshUsersProfilePictures") {
			for (let client of clients) {
				Utils.log("Sent event: refreshUsersProfilePictures to client")
				client.send(JSON.stringify(message));
			}

			return;
		}

		//When someone publish or delete a message
		if (message.eventName === "refreshMessages") {
			for (let client of clients) {
				Utils.log("Sent event: refreshMessages to client")
				client.send(JSON.stringify(message));
			}

			return;
		}

		//Generic type for message as messages don't have the same ID when someone like or remove his like from a message
		if (message.eventName === "refreshMessagesLikes") {
			if (!message.eventParams.messageId) {
				Utils.log("refreshMessagesLikes => Aucun message ID n'a été spécifié")
				return;
			}

			for (let client of clients) {
				Utils.log("Sent event: refreshMessagesLikes with PARAM ID="+message.eventParams.messageId+" to client")
				client.send(JSON.stringify(message));
			}

			return;
		}

		//Generic type for response message as messages don't have the same ID when someone like or remove his like from a message
		if (message.eventName === "refreshMessagesLikesReply") {
			if (!message.eventParams.originalMessageId){
				Utils.log("refreshMessagesLikesReply => Aucun originalMessageId n'a été spécifié")
				return;
			}

			if (!message.eventParams.messageId){
				Utils.log("refreshMessagesLikesReply => Aucun message ID n'a été spécifié")
				return;
			}

			for (let client of clients) {
				Utils.log("Sent event: refreshMessagesLikes with PARAM ORIGINAL_ID="+message.eventParams.originalMessageId+", ID="+message.eventParams.messageId+" to client")
				client.send(JSON.stringify(message));
			}

			return;
		}

		//When someone publish or delete a message (Notification)
		if (message.eventName === "receivedNewMessage") {
			for (let client of clients) {
				Utils.log("Sent event: receivedNewMessage to client")
				client.send(JSON.stringify(message));
			}

			return;
		}

		//When someone publish or delete a message to another message (Notification)
		if (message.eventName === "receivedNewMessageReply") {
			for (let client of clients) {
				Utils.log("Sent event: receivedNewMessageReply to client")
				client.send(JSON.stringify(message));
			}

			return;
		}
	});

	// handling what to do when clients disconnects from server
	clientWebSocket.on("close", (code, data) => {
		Utils.log("the client has disconnected, reason: ", data.toString());
		clients.delete(clientWebSocket);
	});

	// handling client connection error
	clientWebSocket.onerror = () => {
		Utils.log("Some Error occurred")
	}
});

function websocketGetClients() {
	return clients
}

exports.websocketGetClients = websocketGetClients;

function websocketSendToAll(message) {
	message = JSON.parse(message);
	for (let client of clients) {
		Utils.log("Sent event: "+message.eventName+" to client")
		client.send(JSON.stringify(message));
	}
}

exports.websocketSendToAll = websocketSendToAll;

Utils.log("The WebSocket server is running on port", Utils.WS_PORT);