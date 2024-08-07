import clock from "clock";
import document from "document";

import { Stack } from '../../common/stack';
import { formatMessage, getUTCString, processFileQueue, 
  writeMessageToFile, deleteFile, deleteAllMatchingFiles } from '../lib/files';
import { getHeartRateSensor, getAccelerometer }  from '../lib/sensors';
import { initIndex } from "../views/index-init";
import { initMessageSocket, resetMessageSocket, sendQueryMessage } from "../lib/messages";
import { getVibrationCount, getVibrationType, getVibrationLoopCount, vibrationRepeater } from "../lib/haptics";
import {mean} from "scientific";
import sleep from "sleep";

/**
 * Session view menu entry. Manages start/stop of sessions, capturing of sleep state data and
 * user interaction, sends data on interval to companion for REST request and processes response
 */

/**
 * Delta between the toggle click event is sent out, and the toggle value actually updates.
 **/
const TOGGLE_VALUE_DELAY_MS = 300;
/**
 * Leave some room to observe the view coming back when backswipe is canceled. Not mandatory.
 */
const VIEW_RESET_DELAY_MS = 200;
const REST_INTERVAL = 1;
const DIR = "/private/data/"
const MESSAGE_FILE = "message_";
const MESSAGE_FILE_POOL_SIZE = 1000;
const VIBRATION_REPEAT_DELAY_MS = 15000;
const VIBRATION_TIMEOUT_DELAY_MS = 30000;

let sessionStart = undefined;
let sessionResult = "00:00:00"
let durationText = undefined;
let timeText = undefined;
let restIntervalStatus = undefined;
export let logArray = [];
let fileRecon = new Stack();
export let fileQueue = [];

let restIntervalId = undefined;
let restSessionUUID = "";
let restMsg = {}; //the current object to capture state
let msgFilePoolNum = 0;
let acceptAppEvents = true;

let accelerometer = getAccelerometer(restMsg, postUpdate);
let hrm = getHeartRateSensor(restMsg, postUpdate);

export const update = () => {
  const sessionToggle = document.getElementById("session-toggle");
  document.onbeforeunload = sessionOffBackswipeCallback;

  /* Display of the current session time. */
  durationText = document.getElementById("duration");
  durationText.text = sessionResult;

  restIntervalStatus = document.getElementById("rest-interval");
  timeText = document.getElementById("time");

  acceptAppEvents = true;

  /* Session start / stop logic */
  sessionToggle.addEventListener("click", () => {
    setTimeout(() => {
      if (sessionToggle.value == false) {
        resetSession();
        document.onbeforeunload = sessionOffBackswipeCallback;
        return;
      }

      //start the sensor readings
      hrm.start();
      accelerometer.start();

      //clear the log file and private directory before new session
      deleteAllMatchingFiles(DIR, MESSAGE_FILE);
      msgFilePoolNum = 0;

      disableSleepButton(false);

      sessionStart = new Date() / 1000;
      durationText.text = "00:00:00";
      timeText.text = "";
      restIntervalStatus.text = "";
      clock.granularity = "seconds";
      clock.ontick = sessionDurationUpdate;

      restSessionUUID = getSessionId();

      initMessageSocket(handleRestResponse, handleResponse); 

      // Post update every x minute
      restIntervalId = setInterval(postUpdate, (REST_INTERVAL * 1000 * 30) + 500); 

      document.onbeforeunload = sessionBackswipeCallback;

    }, TOGGLE_VALUE_DELAY_MS);
  });
 };

const resetSession = () => {
  /* Reset internal session variables */
  sessionStart = undefined;
  clock.ontick = undefined;
  restSessionUUID = "";
  acceptAppEvents = true;
  
  if (typeof restIntervalId !== 'undefined') {
    clearInterval(restIntervalId);
    restIntervalId = undefined;
  }
  
  /* stop sensor readings */
  hrm.stop();
  accelerometer.stop();

  disableSleepButton(true);
  handleRestResponse("");
  resetMessageSocket();
}

const sessionDurationUpdate = () => {
  if (durationText === undefined) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const totalSeconds = now - sessionStart;
  const hrs = Math.floor(totalSeconds/3600);
  const mins = Math.floor((totalSeconds - hrs*3600)/60);
  const secs = Math.floor(totalSeconds - (hrs*3600 + mins*60));

  durationText.text = [`0${hrs}`.slice(-2), `0${mins}`.slice(-2), `0${secs}`.slice(-2)].join(':');
}

const sessionUpdateView = () => {
  /* When this view exits, we want to restore the document.onbeforeunload handler */
  document.onunload = () => {
    document.onbeforeunload = sessionBackswipeCallback;
  }

  /* Hitting the play button will trigger the sound file to play in the android app and 
     go back to the previous view */
  document.getElementById("btn-play").addEventListener("click", () => {
    let toggleValues = getToggleValues();
    if(toggleValues && toggleValues != "") {
      addEvent("playsound." + toggleValues);
    }  
    document.history.back(); /* We know that this is the topmost view */
    document.onbeforeunload = sessionBackswipeCallback;
  });

  /* Cycling through podcast settings will update the podcast in the android app.  The event
     will end up matching the last selected */
  let podcastCycle = document.getElementById("podcast-cycle");
  podcastCycle.value = 0; //set default when entering view

  podcastCycle.addEventListener("click", () => {
    let cycleVal = new Number(podcastCycle.value);

    let podcastNum = cycleVal == 4 ? 0 : cycleVal;
    podcastNum++;

    addEvent("podcast." +  podcastNum);
  });

  /**
   * Hitting cancel will go back to the previous view, which doesn't unload the current one. We also
   * don't want to replace the previous view (session), but we need to re-set the document backswipe
   * handler, since it's been cleared when loading this view.
   */
  document.getElementById("btn-cancel").addEventListener("click", () => {
    document.history.back(); /* We know that this is the topmost view */
    document.onbeforeunload = sessionBackswipeCallback;
  });
}

function processSleepButton() {
  addEvent("sleep");
} 

function addEvent(event) {
  console.log("adding event = " + event);
  if(restMsg.event === undefined) {
    restMsg.event = event;
  } else {
    let currEvents = restMsg.event.split(";")
    let found = false;
    //replace the old event if updated or add if not found
    currEvents.forEach((currEvent, index) => { 
      if(currEvent.substring(0,4) == event.substring(0,4)) { 
        currEvents[index] = event;
        found = true;
      }
    });
    if(!found) {
      currEvents.push(event);
    }
    restMsg.event = currEvents.join(";");
  }
}

const sessionOffBackswipeCallback = (evt) => {
  evt.preventDefault();

  const background = document.getElementById("background");
  background.x = 0;

  document.location.replace('index.view').then(initIndex).catch((err) => {
    console.error(`Error loading index view - ${err.message}`);
  });
}  

const sessionBackswipeCallback = (evt) => {
  evt.preventDefault();

  const background = document.getElementById("background");
  background.animate("enable");

  /* leave some time for the animation to happen, then load the new view */
  setTimeout(() => {
    document.location.assign('session-update.view').then(sessionUpdateView).catch((err) => {
      console.error(`Error loading finish view - ${err.message}`);
    });
  }, VIEW_RESET_DELAY_MS);
}

const disableSleepButton = (disabled) => {
  let sleepButton = document.getElementById("button-sleep");
  
  if(sleepButton == null) {
    return
  }

  if(disabled == true ) {
    sleepButton.style.fill = "fb-dark-gray";
    sleepButton.removeEventListener("click", processSleepButton);
  } else {
    sleepButton.style.fill = "#B22222";
    sleepButton.addEventListener("click", processSleepButton);
  }
}

//updates the REST status display and initiates a haptic event if found
export const handleRestResponse = (status) => {
  let restIntervalText = status.msg;

  if(restIntervalText === undefined) {
    restIntervalText = "";
  }

  if(restIntervalStatus === undefined) {
    restIntervalStatus = document.getElementById("rest-interval");
  }
  restIntervalStatus.text = restIntervalText;

  if(timeText === undefined) {
    timeText == document.getElementById("timeText");
  }
  timeText.text = formatMessage("");

  //console.log("status=" + JSON.stringify(status));

  let deviceEvent = status.eventType;
  let intensity = status.intensity;

  //check for events back from the android device
  if(deviceEvent && intensity > 0 && acceptAppEvents) {
    acceptAppEvents = false;

    let loopCount = getVibrationLoopCount(intensity);

    let repeater = setInterval(()=>{ 
      vibrationRepeater(intensity, 1200);
      if (!--loopCount) {
        clearInterval(repeater);

        //wait a bit before accepting new events
        setTimeout(() => {
          acceptAppEvents = true;
        }, VIBRATION_TIMEOUT_DELAY_MS);
      } 
    }, VIBRATION_REPEAT_DELAY_MS);

  }

}


const handleResponse = (response) => {
  let removeFile = fileRecon.remove(DIR + response.filename);
  deleteFile(removeFile);
}

const postUpdate = () => {
  //console.log("JS memory: " + memory.js.used + "/" + memory.js.total);
  //listFilesInDirectory(DIR);

  //create a copy and reset the global values
  let restMsgCopy = JSON.parse(JSON.stringify(restMsg));
  Object.keys(restMsg).forEach(key => { restMsg[key] = undefined; });
  
  //set additional fields
  restMsgCopy.sessionId = restSessionUUID;
  let now = new Date();
  restMsgCopy.timestamp = getUTCString(now);
  restMsgCopy.isSleep = sleep.state;

  //process sensor data
  let moveArray = new Float32Array(restMsgCopy.moveArray);
  delete restMsgCopy['moveArray'];

  let moveZArray = new Float32Array(restMsgCopy.moveZArray);
  delete restMsgCopy['moveZArray'];

  restMsgCopy.move = mean(moveArray).toFixed(2);
  restMsgCopy.moveZ = mean(moveZArray).toFixed(2);

  msgFilePoolNum = msgFilePoolNum < MESSAGE_FILE_POOL_SIZE ? msgFilePoolNum + 1 : 0;
  if(msgFilePoolNum == 0) {
    //clear anything in the file history
    fileRecon.length = 0;
    fileQueue.length = 0;
    deleteAllMatchingFiles(DIR, MESSAGE_FILE);
  }
  
  let file = DIR + MESSAGE_FILE +  msgFilePoolNum;
  writeMessageToFile(restMsgCopy, file);
  fileRecon.push(file);
  fileQueue.push(file);

  processFileQueue(fileQueue, msgFilePoolNum, handleRestResponse );
  sendQueryMessage( handleRestResponse );
}

const getSessionId = () => {
  return Date.now().toString(36) + 
    Math.random().toString(36).substring(2);
};

export const init = () => {
  return document
  .location.assign('session.view');
}


/* get the sound setting toggle values */
const getToggleValues = () => {
  let ssildValue = document.getElementById("ssild-toggle").value;
  let mildValue = document.getElementById("mild-toggle").value;
  let wildValue = document.getElementById("wild-toggle").value;
  let toggleValues = ssildValue ? "s," : "";
  if(mildValue) {
    toggleValues += "m,";
  }
  if(wildValue) {
    toggleValues += "w,";
  }

  //console.log("ssildValue=" + ssildValue + ",mildValue=" 
  //  + mildValue + ",wildValue=" + wildValue + ",return=" + toggleValues)

  return toggleValues;
}
