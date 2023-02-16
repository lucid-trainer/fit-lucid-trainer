import document from "document";
import { readFromLog } from '../lib/files';

const LOG_HEADER = "RECENT ACTIVITY";

/**
 * Log view menu entry
 */

export function update() {
  let myList = document.getElementById("myList");
  let logArray = readFromLog().split(/\r?\n/);
  logArray.unshift(LOG_HEADER);

  let NUM_ELEMS = logArray.length;
  
  myList.delegate = {
    getTileInfo: (index) => {
      return {
        type: "my-pool",
        value: "Log Item",
        index: index
      };
    },
    configureTile: (tile, info) => {
      //console.log(`Item: ${info.index}`)
      if (info.type == "my-pool") {
        tile.getElementById("text").text = `${logArray[info.index]}`;
        let touch = tile.getElementById("touch");
        touch.onclick = function(evt) {
          console.log(`touched: ${info.index}`);
        };
      }
    }
  };
  
  // length must be set AFTER delegate
  myList.length = NUM_ELEMS;
  return;
}

export function init() {
  return document.location.assign('log.view');
}
