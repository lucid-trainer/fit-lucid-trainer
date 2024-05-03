import * as fs from "fs";
import { outbox } from "file-transfer";

const SETTINGS_FILE = "settings.cbor";

export const saveSettings = (haptic, duration) => {

  let json_data = {
    haptic: haptic,
    duration: duration,
  };

  fs.writeFileSync(SETTINGS_FILE, json_data, "cbor");
};

export const getSettings = () => {
    let json_data  = fs.readFileSync(SETTINGS_FILE, "cbor");

    const haptic = json_data.haptic.values[0].value || '';
    const duration = json_data.duration.values[0].value || 0;
    
    //console.log("haptic: " + JSON.stringify(haptic) + " duration: " + JSON.stringify(duration));

    return {
      haptic: haptic, 
      duration: duration
    };
  };

  export const formatMessage = (message) => {
    if(message || message === "") {
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

  export const processFileQueue = (fileQueue, fileNum, setStatusCallback) => {
    //check if the outbox queue is empty indicating that the connection with the 
    //companion is working.
    outbox.enumerate().then((value) => {
      let outboxSize = value.length;
  
      if (outboxSize == 0) {
        //send up to 5 messages to catch up in the queue
        var sendCnt = 0;
        while (fileQueue.length && sendCnt < 5) {
          let messageFile = fileQueue.shift();
          sendMessageFile(messageFile, setStatusCallback);
          sendCnt++;
        }
      } else {
        setStatusCallback({
          msg: `FILE ${fileNum} QUEUED`
        });
      }
    })
      .catch((err) => {
        console.error(err);
      });
  };

  export const writeMessageToFile = (message, file) => {
    fs.writeFileSync(file, JSON.stringify(message), "ascii");
  }

  export const sendMessageFile = (file, setStatusCallback) => {
      setStatusCallback({
        msg: "SENDING..."
      });

      outbox.enqueueFile(file)
        .then(ft => {
          console.log(`Transfer of ${ft.name} successfully queued.`);
        })
        .catch(err => {
          console.error(`Failed to schedule transfer: ${err}`);
        })

      let num = Number(file.split('_').pop());
      setStatusCallback( {
        msg : `FILE ${num} SENT`
      });
  }

  export const deleteAllMatchingFiles = (directory, substr) => {
    var listDir = fs.listDirSync(directory);
    var dirIter;

    while((dirIter = listDir.next()) && !dirIter.done) {
      let filename = dirIter.value;
      if (filename.indexOf(substr) !== -1) {
        let file = directory + dirIter.value;
        deleteFile(file);
      }
    }
  }

  export const deleteFile = (file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }  
  }

  export const listFilesInDirectory = (directory) => {
    var listDir = fs.listDirSync(directory);
    var dirIter;

    console.log("files in " + directory);
    while((dirIter = listDir.next()) && !dirIter.done) {
      console.log(dirIter.value);
    }
  }

  function addZero(i) {
    if (i < 10) {i = "0" + i}
    return i;
  }
