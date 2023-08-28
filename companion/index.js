import * as messaging from 'messaging'
import { settingsStorage } from 'settings'
import { postMessage } from "../common/rest.js"
import { me as companion} from "companion";
import { inbox } from "file-transfer";

let messageQueue = [];
const ping = { key: "wakeCompanionEvent", value: "wake up!" };
const MILLISECONDS_PER_MINUTE = 1000 * 60;

//try to wake up the companion every 5 minutes
companion.wakeInterval = 5 * MILLISECONDS_PER_MINUTE;

// Listen for the event
companion.addEventListener("wakeinterval", () => {
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
      messaging.peerSocket.send(message);
    }
  } else {
    console.error("Error: Connection is not open");
  }  

}

const postRestMessage = (msg, filename) => {
  postMessage(msg)
  .then(response => {
    response.filename = filename;
    const data = {
      key: "restResponse",
      value: response,
    }
    messageQueue.push(data);
    sendMessageToDevice();
  }).catch(function (e) {
    console.error(e);
  });
}

async function processAllFiles() {
  try {
    let file;
    while ((file = await inbox.pop())) {
      const payload = await file.text();
      const filename = await file.name;
      
      let message = JSON.parse(payload);
      postRestMessage(message, filename);
    }
  } catch(e) {
      console.error(e);
  }
}

inbox.addEventListener("newfile", processAllFiles);


