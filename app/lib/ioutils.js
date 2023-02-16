import * as fs from "fs";

const SETTINGS_FILE = "settings.cbor";

export const saveSettings = (haptic, duration) => {

  let json_data = {
    haptic: haptic,
    duration: duration,
  };

  console.log("writing settings: " + JSON.stringify(json_data));

  fs.writeFileSync(SETTINGS_FILE, json_data, "cbor");
};

export const getSettings = () => {
    let json_data  = fs.readFileSync(SETTINGS_FILE, "cbor");
  
    console.log("settings: " + JSON.stringify(json_data));

    const haptic = json_data.haptic.values[0].value || '';
    const duration = json_data.duration.values[0].value || 0;
    
    
    console.log("haptic: " + JSON.stringify(haptic) + " duration: " + JSON.stringify(duration));

    return {
      haptic: haptic, 
      duration: duration
    };
  };