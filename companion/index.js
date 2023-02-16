import * as messaging from 'messaging'
import { settingsStorage } from 'settings'

// Message socket opens
messaging.peerSocket.onopen = () => {
  restoreSettings();
}

// A user changes settings
settingsStorage.onchange = (evt) => {
  const data = {
    key: evt.key,
    value: JSON.parse(evt.newValue),
  }

  sendVal(data);
}

function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    const key = settingsStorage.key(index)

    if (key) {
      const data = {
        key,
        value: JSON.parse(settingsStorage.getItem(key)),
      }

      sendVal(data);
    }
  }
}

function sendVal(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
}
