import * as messaging from "messaging";

const ping = {
  key: "wakeEvent",
  value: "wake up!",
};

export const sendMessageQueue = (messageQueue, messageCommand, setStatusCallback) => {

  console.log("readyState: " + messaging.peerSocket.readyState);
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    setStatusCallback("SENDING...");
    while(messageQueue.length) {
      console.log("messageQueue length: " + messageQueue.length);
      let message = messageQueue.shift()
      console.log("rest call request: " + JSON.stringify(message));
      messaging.peerSocket.send({
        command: messageCommand,
        msg: message
      });
    }
  } else {
    setStatusCallback("...QUEING");
    messaging.peerSocket.send(ping);
  }
    
}

export const initMessageSocket = (messageQueue, messageCommand, responseKey, setStatusCallback, logResponse) => {
   
  if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    setStatusCallback("CONNECT READY");
  } else {
    setStatusCallback("CONNECT PEND");
  }

  // Begin processing the queue when a connection opens
  messaging.peerSocket.open = function() {
    console.log("Peer socket opened");
    sendMessageQueue(messageQueue, messageCommand, setStatusCallback);
  }

  // Listen for the onmessage event from companion
  messaging.peerSocket.onmessage = function(evt) {
    if(evt.data.key === responseKey) {
      let response = evt.data.value.data;
      console.log("response: " + response);
      logResponse(response);
      
      setStatusCallback("RECEIVED");
    }  
  }
}

export const resetMessageSocket = () => {
  messaging.peerSocket.open = undefined;
  messaging.peerSocket.onmessage = undefined;
}

  
