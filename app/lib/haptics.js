import { vibration } from "haptics";

export const vibrationRepeater = (intensity, interval) => {
    let startPattern = getStartVibrationType(intensity)
    let pattern = getVibrationType(intensity)
    let counter = getVibrationCount(intensity);

    vibration.start(startPattern);
    let timer = setInterval(()=>{  
      vibration.stop();
      vibration.start(pattern);
      if (!--counter) clearInterval(timer)
    }, interval);
    
    vibration.stop(); 
  }

/*
  1 use bump
  2 use confirmation
  3 use nudge
  4-5 use nudge-max
*/
export const getStartVibrationType = (intensity) => {
  let vibrationType = "nudge-max";

  if(intensity == 1) {
    vibrationType = "bump"; 
  } else if (intensity == 2) {
    vibrationType = "confirmation"; 
  } else if(intensity == 3) {
    vibrationType = "nudge";
  }  

  return vibrationType;
}


/*
  1-2 use bump
  3-4 use confirmation
  5 use nudge haptic
*/
export const getVibrationType = (intensity) => {
  let vibrationType = "nudge";

  if(intensity == 1 || intensity == 2) {
    vibrationType = "bump"; 
  } else if(intensity == 3 || intensity == 4) {
    vibrationType = "confirmation"
  }

  return vibrationType;
}

/* 
 do up to 4 repeats
*/
export const getVibrationCount = (intensity) => {
  let vibrationCount = intensity >= 4 ? 4 : intensity

  return vibrationCount;
}

/*
  1-4 do the vibration routine 1 time
  5 do the vibration 2 times
*/
export const getVibrationLoopCount = (intensity) => {
  return intensity < 5 ? 1 : 2;
}