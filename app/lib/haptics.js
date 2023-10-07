import { vibration } from "haptics";

export const vibrationRepeater = (pattern, count, interval) => {
    //console.log("pattern: " + JSON.stringify(pattern) + " count: " + JSON.stringify(count));
    let counter = count - 1;
    if(pattern === 'alert') {
      vibration.start(pattern);
      setTimeout(() => {
        vibration.stop();
      }, 1000*count); 
      //console.log('sent ' + pattern);
    } else {
      vibration.start(pattern);
      let timer = setInterval(()=>{  
        vibration.stop();
        vibration.start(pattern);
        //console.log('sent ' + pattern);
        if (!--counter) clearInterval(timer)
      }, interval);
    }
    vibration.stop(); 
  }