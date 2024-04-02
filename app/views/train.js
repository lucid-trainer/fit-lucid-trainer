import clock from "clock";
import document from "document";

import { initMessageSocket, resetMessageSocket, sendQueryMessage } from "../lib/messages";
import { vibrationRepeater } from "../lib/haptics";
import { formatMessage} from '../lib/files';

/**
 * Training view menu entry. Manages start/stop of training session, captures haptic events from API
 */

/**
 * Delta between the toggle click event is sent out, and the toggle value actually updates.
 **/
const TOGGLE_VALUE_DELAY_MS = 300;
const REST_INTERVAL = 1;
const VIBRATION_REPEAT = 3;
const VIBRATION_REPEAT_DELAY_MS = 30000;

let sessionStart = undefined;
let sessionResult = "00:00:00"
let durationText = undefined;
let restIntervalStatus = undefined;
let acceptAppEvents = true;

export let logArray = [];
export let fileQueue = [];

let restIntervalId = undefined;

export const update = () => {
  const trainToggle = document.getElementById("train-toggle");

  /* Display of the current session time. */
  durationText = document.getElementById("duration");
  durationText.text = sessionResult;

  restIntervalStatus = document.getElementById("rest-interval");

  /* Session start / stop logic */
  trainToggle.addEventListener("click", () => {
    setTimeout(() => {
      if (trainToggle.value == false) {
        resetSession();
        return;
      }

      sessionStart = new Date() / 1000;
      durationText.text = "00:00:00";
      clock.granularity = "seconds";
      clock.ontick = sessionDurationUpdate;
      acceptAppEvents = true;

      initMessageSocket(handleRestResponse, handleResponse); 

      // Post update every x minute
      restIntervalId = setInterval(getUpdate, (REST_INTERVAL * 1000 * 30) + 500); 

    }, TOGGLE_VALUE_DELAY_MS);
  });
 };

const resetSession = () => {
  /* Reset internal session variables */
  sessionStart = undefined;
  clock.ontick = undefined;
  acceptAppEvents = true;
  
  if (typeof restIntervalId !== 'undefined') {
    clearInterval(restIntervalId);
    restIntervalId = undefined;
  }

  handleRestResponse({msg: ""});
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

//updates the REST status display and initiates a haptic event if found
export const handleRestResponse = (status) => {
  let restIntervalText = formatMessage(status.msg);
  if(restIntervalStatus === undefined) {
    restIntervalStatus = document.getElementById("rest-interval");
  }
  restIntervalStatus.text = restIntervalText;

  let deviceEvent = status.eventType;
  let intensity = status.intensity;

  //check for events back from the android device
  if(deviceEvent && acceptAppEvents) {
    acceptAppEvents = false;

    let vibrationType = intensity > 2 ? "nudge-max" : "nudge";
    let counter = intensity == 1 ? 1 : 2;

    let repeater = setInterval(()=>{ 
      vibrationRepeater(vibrationType, VIBRATION_REPEAT, 1000);
      if (!--counter) {
        clearInterval(repeater);

        setTimeout(() => {
          acceptAppEvents = true;
        }, VIBRATION_REPEAT_DELAY_MS);
      } 
    }, VIBRATION_REPEAT_DELAY_MS);

  }

}

const handleResponse = (response) => {
  //nothing for now in training mode
}

const getUpdate = () => {
  sendQueryMessage( handleRestResponse );
}

export const init = () => {
  return document
  .location.assign('train.view');
}

