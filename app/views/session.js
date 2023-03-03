import clock from "clock";
import document from "document";

import { writeToLog, clearLog, formatMessage } from '../lib/files';
import { getHeartRateSensor, getAccelerometer }  from '../lib/sensors';
import { initIndex } from "../views/index-init";
import { sendMessageQueue, initMessageSocket, resetMessageSocket } from "../lib/messages";
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
const REST_MESSAGE_CMD = "restUpdate";
const REST_RESPONSE_KEY = "restResponse";

let sessionStart = undefined;
let sessionResult = "00:00:00"
let durationText = undefined;
let restIntervalStatus = undefined;
let logArray = [];

let restMessageQueue = [];
let restIntervalId = undefined;
let restSessionUUID = "";
let restMsg = {}; //the current object to capture state
let dreamClickCnt = 0;

let accelerometer = getAccelerometer(restMsg);
let hrm = getHeartRateSensor(restMsg);

function resetSession() {
  /* Reset internal session variables */
  sessionStart = undefined;
  clock.ontick = undefined;
  restSessionUUID = "";
  
  if (typeof restIntervalId !== 'undefined') {
    clearInterval(restIntervalId);
    restIntervalId = undefined;
  }
  
  /* stop sensor readings */
  hrm.stop();
  accelerometer.stop();

  disableDreamButton(true);
  updateRestStatusText("");
  resetMessageSocket();
}

function sessionDurationUpdate() {
  if (durationText === undefined) {
    return;
  }

  //const now = new Date();
  const now = Math.floor(Date.now() / 1000);
  const totalSeconds = now - sessionStart;
  const hrs = Math.floor(totalSeconds/3600);
  const mins = Math.floor((totalSeconds - hrs*3600)/60);
  const secs = Math.floor(totalSeconds - (hrs*3600 + mins*60));

  console.log("totalSeconds " + totalSeconds + ", hrs" + hrs + ", mins" + mins + ", secs" + secs);

  durationText.text = [`0${hrs}`.slice(-2), `0${mins}`.slice(-2), `0${secs}`.slice(-2)].join(':');
  console.log(durationText.text);
}

function updateFinishView() {
  /* When this view exits, we want to restore the document.onbeforeunload handler */
  document.onunload = () => {
    document.onbeforeunload = sessionBackswipeCallback;
  }

  /* Clear the session log */
  logArray.length = 0;
  
  /* Finishing the session will reload the view. Update just the last session duration. */
  document.getElementById("btn-finish").addEventListener("click", () => {
    console.log("Finishing session");

    /* Final updates */
    sessionDurationUpdate();
    sessionResult = durationText.text;
    
    resetSession();
    document.onbeforeunload = sessionOffBackswipeCallback;

    document.history.back(); /* we know that this is the topmost view */

    /*
     * NOTE: The side-effect is that the forward view stack history is cleared and the views are
     * unloaded.
     */
    
    document.location.replace("session.view").then(update).catch((err) => {
      console.error(`Error returning to session view - ${err.message}`);
    });    
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

/* process the dream button click */
function processDreamButton() {
  if(dreamClickCnt == 0) {
    logArray.unshift(formatMessage("DREAM"));
    writeToLog(logArray);
  }  

  if (dreamClickCnt < 5) {
    dreamClickCnt++;
  }
  
  restMsg.event = "dream." + dreamClickCnt;
}  

export function update() {
  const sessionToggle = document.getElementById("session-toggle");
  document.onbeforeunload = sessionOffBackswipeCallback;

  /* Display of the current session time. */
  durationText = document.getElementById("duration");
  durationText.text = sessionResult;

  restIntervalStatus = document.getElementById("rest-interval");

  /* Session start / stop logic */
  sessionToggle.addEventListener("click", () => {
    setTimeout(() => {
      if (sessionToggle.value == false) {
        resetSession();
        document.onbeforeunload = sessionOffBackswipeCallback;
        return;
      }

      //start the sensor readings
      console.log("start heart monitor");
      hrm.start();

      console.log("start accelerometer");
      accelerometer.start();

      //clear the log file before new session
      clearLog();

      disableDreamButton(false);

      sessionStart = new Date() / 1000;
      durationText.text = "00:00:00";

      clock.granularity = "seconds";
      clock.ontick = sessionDurationUpdate;

      
      restSessionUUID = getSessionId();

      initMessageSocket(restMessageQueue, REST_MESSAGE_CMD, 
        REST_RESPONSE_KEY, updateRestStatusText, logResponse); 

      // Post update every x minute
      restIntervalId = setInterval(postUpdate, REST_INTERVAL * 1000 * 60); 

      document.onbeforeunload = sessionBackswipeCallback;

    }, TOGGLE_VALUE_DELAY_MS);
  });
};

const sessionOffBackswipeCallback = (evt) => {
  console.log("onbeforeunload called for off");
  evt.preventDefault();

  const background = document.getElementById("background");
  console.log("resetting view with animation");
  background.x = 0;

  document.location.replace('index.view').then(initIndex).catch((err) => {
    console.error(`Error loading index view - ${err.message}`);
  });
}  

const sessionBackswipeCallback = (evt) => {
  console.log("onbeforeunload called");
  evt.preventDefault();

  const background = document.getElementById("background");
  console.log("resetting view with animation");
  background.animate("enable");

  /* leave some time for the animation to happen, then load the new view */
  setTimeout(() => {
    document.location.assign('session-finish.view').then(updateFinishView).catch((err) => {
      console.error(`Error loading finish view - ${err.message}`);
    });
  }, VIEW_RESET_DELAY_MS);
}

function disableDreamButton(disabled) {
  let dreamButton = document.getElementById("button-dream");
  
  if(dreamButton == null) {
    return
  }

  if(disabled == true ) {
    dreamButton.style.fill = "fb-dark-gray";
    dreamButton.removeEventListener("click", processDreamButton);
  } else {
    dreamButton.style.fill = "fb-cyan";
    dreamButton.addEventListener("click", processDreamButton);
  }
}

const updateRestStatusText = (status) => {
  let restIntervalText = formatMessage(status);
  if(restIntervalStatus === undefined) {
    restIntervalStatus = document.getElementById("rest-interval");
  }
  restIntervalStatus.text = restIntervalText;
}

const logResponse = (response) => {
  let { movement, heartRate, isSleep } = JSON.parse(response)
  logArray.unshift(formatMessage("RCVD " + movement + ":" + heartRate + ":" + isSleep));
  writeToLog(logArray);
}

function postUpdate() {
  console.log("enter postUpdate");
  restMsg.sessionId = restSessionUUID;
  restMsg.timestamp = Date.now();
  restMsg.isSleep = sleep.state;
  let restMsgCopy = JSON.parse(JSON.stringify(restMsg));
  restMessageQueue.push(restMsgCopy);

  Object.keys(restMsg).forEach(key => { restMsg[key] = undefined; });
  dreamClickCnt = 0;
  sendMessageQueue(restMessageQueue, REST_MESSAGE_CMD, updateRestStatusText);
}

const getSessionId = () => {
  return Date.now().toString(36) + 
    Math.random().toString(36).substring(2);
};

export function init() {
  console.log("session-view start");
  return document
  .location.assign('session.view');
}


