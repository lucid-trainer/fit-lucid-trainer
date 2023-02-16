import * as messaging from 'messaging'
import { settingsStorage } from 'settings'
import { RestAPI } from "./rest.js"
import { me as companion} from "companion";

let messageQueue = [];

const ping = {
  key: "wakeCompanionEvent",
  value: "wake up!",
};

const MILLISECONDS_PER_MINUTE = 1000 * 60;
//wake up the companion every 5 minutes
companion.wakeInterval = 5 * MILLISECONDS_PER_MINUTE;

// Listen for the event
companion.addEventListener("wakeinterval", () => {
  console.log("Wake interval happened!");
  messageQueue.push(ping);
  sendMessageToDevice();
});

// Message socket opensinst
messaging.peerSocket.onopen = () => {
  restoreSettings();
  sendMessageToDevice();
}

// A user changes settings
settingsStorage.onchange = (evt) => {
  const data = {
    key: evt.key,
    value: JSON.parse(evt.newValue),
  }

  messageQueue.push(data);
  sendMessageToDevice();
}

function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    const key = settingsStorage.key(index)

    if (key) {
      const data = {
        key,
        value: JSON.parse(settingsStorage.getItem(key)),
      }
      messageQueue.push(data);
      sendMessageToDevice();
    }
  }
}

//send message to device 
function sendMessageToDevice() {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    while(messageQueue.length) {
      console.log("messageQueue length: " + messageQueue.length);
      let message = messageQueue.shift()
      console.log("message: " + JSON.stringify(message));
      messaging.peerSocket.send(message);
    }
  } else {
    console.log("Error: Connection is not open");
  }  

}

// Listen for the onmessage event from device
messaging.peerSocket.onmessage = function(evt) {
  if(evt.data && evt.data.command === "restUpdate") {
    postRestMessage(evt.data.msg);
  }
}

function postRestMessage(msg) {
  let restApi = new RestAPI();
  restApi.postMessage(msg)
  .then(response => {
    const data = {
      key: "restResponse",
      value: response,
    }
    messageQueue.push(data);
    sendMessageToDevice();
  }).catch(function (e) {
    console.log("error"); console.log(e)
  });
}
