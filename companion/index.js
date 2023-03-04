import * as messaging from 'messaging'
import { settingsStorage } from 'settings'
import { postMessage } from "./rest.js"
import { me as companion} from "companion";

let messageQueue = [];
const REST_MESSAGE_CMD = "restUpdate";
const REST_URL = "https://httpbin.org/post";  //replace with your server address

const ping = { key: "wakeCompanionEvent", value: "wake up!" };

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

// Listen for the onmessage event from device
messaging.peerSocket.onmessage = function(evt) {
  if(evt.data && evt.data.command === REST_MESSAGE_CMD) {
    postRestMessage(evt.data.msg);
  }
}

const restoreSettings = () => {
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
const sendMessageToDevice = () => {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    while(messageQueue.length) {
      let message = messageQueue.shift()
      console.log("message: " + JSON.stringify(message));
      messaging.peerSocket.send(message);
    }
  } else {
    console.log("Error: Connection is not open");
  }  

}

const postRestMessage = (msg) => {
  postMessage(msg, REST_URL)
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
