import * as messaging from "messaging";
import { REST_RESPONSE_KEY, MSG_FROM_DEVICE_KEY, 
  DEVICE_QUERY_KEY, formatResponse} from "../../common/rest";
import { getUTCString } from "../lib/files"

export const ping = { key: "wakeEvent", value: "wake up!" };

export const initMessageSocket = (setStatusCallback, handleResponse) => {   
  if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    setStatusCallback({
      msg: "CONNECT READY"
    });
  } else {
    setStatusCallback({ 
      msg: "CONNECT PEND"
    });
  }

  // Send a ping when a connection opens
  messaging.peerSocket.onopen = function() {
    messaging.peerSocket.send(ping);
  }

  // Listen for the onmessage event from companion
  messaging.peerSocket.onmessage = function(evt) {
    if(evt.data.key === REST_RESPONSE_KEY) {
      //console.log("rest response in message= " + JSON.stringify(evt.data));
      let response = formatResponse(evt.data.value);
      handleResponse(response);
      
      let { filename } = evt.data.value;
      let num = Number(filename.split('_').pop());
      setStatusCallback(
        {
          msg: "RECEIVED FILE " + num
        });
    } else if(evt.data.key === MSG_FROM_DEVICE_KEY) {
      let { eventType } = evt.data.value;
      //console.log("data from device=" + JSON.stringify(evt.data.value) + " -END-");
      setStatusCallback({
        msg: "RECEIVED FROM DEVICE",
        event: eventType 
      })
    }
  }  
}

// sends message to companion to query the REST api for new app events
export const sendQueryMessage = (setStatusCallback) => {

  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    setStatusCallback({msg: "QUERYING.."});

    let now = new Date(Date.now() - 60000);
    let timestamp = getUTCString(now);
    let message = { timestamp }

    console.log("rest call message request: " + JSON.stringify(message));
      messaging.peerSocket.send({
        command: DEVICE_QUERY_KEY,
        msg: message
      });

      setStatusCallback({msg: "CONNECT WAIT"});
  } else {
    setStatusCallback({msg: "...QUERYING FAILED"});
    try {
      //maybe if ping it the connection with the companion will open
      messaging.peerSocket.send(ping);
    } catch {
      //do nothing
    }  
  }
}

export const resetMessageSocket = () => {
  messaging.peerSocket.onopen = undefined;
  messaging.peerSocket.onmessage = undefined;
}

