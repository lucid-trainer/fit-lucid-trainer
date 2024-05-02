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

export const getVibrationType = (intensity) => {
  let vibrationType = "bump";
    
  if(intensity === 2 || intensity === 3) {
    vibrationType = "confirmation"; 
  } else if(intensity === 4) {
    vibrationType = "nudge";
  }

  return vibrationType;
}
