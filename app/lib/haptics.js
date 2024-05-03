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

/*
  1, 2, or 3 use the bump haptic
  4 use confirmation haptic
  5 use nudge haptic
*/
export const getVibrationType = (intensity) => {
  let vibrationType = "bump";

  if(intensity === 4) {
    vibrationType = "confirmation"; 
  } else if(intensity === 5) {
    vibrationType = "nudge";
  }

  return vibrationType;
}

/*
  1 do 1 short vibration
  2 do 2 short vibrations in quick succession
  3, 4, 5 do 3 short vibrations in quick succession
*/
export const getVibrationCount = (intensity) => {
  let vibrationCount = 1
  
  if(intensity === 2 ) {
    vibrationCount = 2 
  } else if (intensity > 2) {
    vibrationCount = 3
  }

  return vibrationCount;
}

/*
  1, 2 do the vibration routine 1 time
  3, 4, 5 do it 2 times
*/
export const getVibrationLoopCount = (intensity) => {
  return intensity < 3 ? 1 : 2;
}