import clock from "clock";
import document from "document";
import * as messaging from "messaging";

import { writeToLog, clearLog, formatMessage } from '../lib/files';
import { getHeartRateSensor, getAccelerometer }  from '../lib/sensors';
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

let sessionBackswipeCallback = undefined;
let sessionStart = undefined;
let sessionResult = "00:00:000"
let durationText = undefined;
let restIntervalStatus = undefined;
let logArray = [];

let restMessageQueue = [];
let restIntervalId = undefined;
let restSessionUUID = "";
let restMsg = {}; //the current object to capture state

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
}

function sessionDurationUpdate() {
  if (durationText === undefined) {
    return;
  }

  const now = new Date();
  const millis = now - sessionStart;
  const secs = Math.floor(millis / 1000);
  const mins = Math.floor(secs / 60);
  durationText.text = [`0${mins}`.slice(-2), `0${secs}`.slice(-2), millis % 1000].join(':');
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

/* process the DREAM button click */
function processDreamButton() {
  restMsg.event = "dreamButton.click";
  logArray.unshift(formatMessage("DREAM"));
  writeToLog(logArray);
  console.log("CLICKED DREAM");
};

export function update() {
  const sessionToggle = document.getElementById("session-toggle");
  /* Display of the current session time. */
  durationText = document.getElementById("duration");
  durationText.text = sessionResult;

  restIntervalStatus = document.getElementById("rest-interval");

  /* Session start / stop logic */
  sessionToggle.addEventListener("click", () => {
    setTimeout(() => {
      if (sessionToggle.value == false) {
        resetSession();
        document.onbeforeunload = undefined;
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

      sessionStart = new Date();
      durationText.text = "00:00:000";

      clock.granularity = "seconds";
      clock.ontick = sessionDurationUpdate;

      
      restSessionUUID = getSessionId();

      if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        updateRestStatusText("CONNECT READY");
      } else {
        updateRestStatusText("CONNECT ERROR");
      }  

      // Post update every x minute
      restIntervalId = setInterval(postUpdate, REST_INTERVAL * 1000 * 60);   

      document.onbeforeunload = (evt) => {
        console.log("onbeforeunload called");
        evt.preventDefault();

        /* save the old session handling, we'll need it in case session is not finished */
        sessionBackswipeCallback = document.onbeforeunload;

        /* leave some time for the animation to happen, then load the new view */
        setTimeout(() => {
          document.location.assign('session-finish.view').then(updateFinishView).catch((err) => {
            console.error(`Error loading finish view - ${err.message}`);
          });
        }, VIEW_RESET_DELAY_MS);
      }
    }, TOGGLE_VALUE_DELAY_MS);
  });
};

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

function updateRestStatusText(status)  {
  let restIntervalText = formatMessage(status);
  if(restIntervalStatus === undefined) {
    restIntervalStatus = document.getElementById("rest-interval");
  }
  restIntervalStatus.text = restIntervalText;
}

function postUpdate() {
  console.log("enter postUpdate");
  restMsg.sessionId = restSessionUUID;
  restMsg.timestamp = Date.now();
  restMsg.isSleep = sleep.state;
  let restMsgCopy = JSON.parse(JSON.stringify(restMsg));
  restMessageQueue.push(restMsgCopy);

  Object.keys(restMsg).forEach(key => { restMsg[key] = undefined; });

  console.log("readyState: " + messaging.peerSocket.readyState);
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    updateRestStatusText("SENDING...");
    sendQueue();
  } else {
    updateRestStatusText("...QUEING");
    sendQueue();
  }
}

function sendQueue() {
  while(restMessageQueue.length) {
    console.log("restMessageQueue length: " + restMessageQueue.length);
    let queueRestMsg = restMessageQueue.shift()
    console.log("rest call request: " + JSON.stringify(queueRestMsg));
    messaging.peerSocket.send({
      command: "restUpdate",
      msg: queueRestMsg
    });
  }
}

// Begin processing the queue when a connection opens
messaging.peerSocket.open = function() {
  console.log("Peer socket opened");
  sendQueue();
}

// Listen for the onmessage event from companion
messaging.peerSocket.onmessage = function(evt) {
  if(evt.data.key === 'restResponse') {
    let response = evt.data.value.data;
    console.log("rest call response: " + response);
    
    updateRestStatusText("RECEIVED");
  }  
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
