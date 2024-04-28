import Utils from './Utils';
import ReconnectingWebSocket from 'reconnecting-websocket';

let socket = new ReconnectingWebSocket(Utils.SOCKET_URL);

socket.onopen = (e) => {
   console.log("WebSocket | [open] Connection established");
};

socket.onclose = (event) => {
   if (event.wasClean) {
      console.log("WebSocket | [close] Connection closed cleanly, code="+event.code+" reason="+event.reason);
   } else {
      console.error("WebSocket | [close] Connection died, code="+event.code+" reason="+event.reason);
   }
};

export default socket;