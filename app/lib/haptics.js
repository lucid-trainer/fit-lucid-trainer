import { vibration } from "haptics";

export const vibrationRepeater = (pattern, count, interval) => {
    let counter = count;

    vibration.start(pattern);
    let timer = setInterval(()=>{  
      vibration.stop();
      vibration.start(pattern);
      if (!--counter) clearInterval(timer)
    }, interval);
    
    vibration.stop(); 
  }
