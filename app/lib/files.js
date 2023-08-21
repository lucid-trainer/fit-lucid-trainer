import * as fs from "fs";
import { outbox } from "file-transfer";

const SETTINGS_FILE = "settings.cbor";
const MESSAGE_FILE_PATH = "/private/data/"
const LOG_FILE = "sesslog.txt";
const LOG_LENGTH = 12;

export const saveSettings = (haptic, duration) => {

  let json_data = {
    haptic: haptic,
    duration: duration,
  };

  console.log("writing settings: " + JSON.stringify(json_data));

  fs.writeFileSync(SETTINGS_FILE, json_data, "cbor");
};

export const getSettings = () => {
    let json_data  = fs.readFileSync(SETTINGS_FILE, "cbor");

    const haptic = json_data.haptic.values[0].value || '';
    const duration = json_data.duration.values[0].value || 0;
    
    console.log("haptic: " + JSON.stringify(haptic) + " duration: " + JSON.stringify(duration));

    return {
      haptic: haptic, 
      duration: duration
    };
  };

  export const writeToLog = (logArray) => {
    let message = '';
    if(logArray.length > LOG_LENGTH) {
      logArray.length = LOG_LENGTH;
    }

    for (let i = 0; i < logArray.length; i++) {
      message = message + logArray[i] + "\n";
    }

    fs.writeFileSync(LOG_FILE, message, "ascii");
  };

  export const readFromLog = () => {
    let messages = '';
    if (fs.existsSync(LOG_FILE)) {
      messages = fs.readFileSync(LOG_FILE, "ascii");
    }
    return messages;
  }

  export const clearLog = () => {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE); 
    }
  }

  export const formatMessage = (message) => {
    if(message) {
      let d = new Date();
      let timeString = addZero(d.getHours()) + ":" + addZero(d.getMinutes());
      return timeString + " " + message;
    }
    
    return "";
  }

  export const getUTCString = (now) =>  {
    now = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return now.toJSON().slice(0,-1);
  }

export const sendMessageInFile = (message, msgFilePoolNum, setStatusCallback) => {
    setStatusCallback("SENDING...");
    console.log("writing message: " + JSON.stringify(message));

    let file = MESSAGE_FILE_PATH + "message_" + msgFilePoolNum + ".txt"

    fs.writeFileSync(file, JSON.stringify(message), "ascii");

    outbox.enqueueFile(file)
      .then(ft => {
        console.log(`Transfer of ${ft.name} successfully queued.`);
        fs.unlinkSync(file);
      })
      .catch(err => {
        console.log(`Failed to schedule transfer: ${err}`);
      })

    setStatusCallback("FILE SENT...");
}

  function addZero(i) {
    if (i < 10) {i = "0" + i}
    return i;
  }
