import * as messaging from "messaging";
import { formatResponse} from "../../common/rest";

export const ping = { key: "wakeEvent", value: "wake up!" };

export const initMessageSocket = (messageCommand, responseKey, setStatusCallback, handleResponse) => {   
  if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    setStatusCallback("CONNECT READY");
  } else {
    setStatusCallback("CONNECT PEND");
  }

  // Send a ping when a connection opens
  messaging.peerSocket.onopen = function() {
    messaging.peerSocket.send(ping);
  }

  // Listen for the onmessage event from companion
  messaging.peerSocket.onmessage = function(evt) {
    if(evt.data.key === responseKey) {
      let response = formatResponse(evt.data.value);
      handleResponse(response);
      
      setStatusCallback("RECEIVED");
    }  
  }
}

export const resetMessageSocket = () => {
  messaging.peerSocket.onopen = undefined;
  messaging.peerSocket.onmessage = undefined;
}

