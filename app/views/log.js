import document from "document";
import { readFromLog } from '../lib/files';
import {initIndex} from "../views/index-init";

const LOG_HEADER = "RECENT ACTIVITY";

/**
 * Log view menu entry
 */
export function update() {
  let myList = document.getElementById("myList");
  document.onbeforeunload = logBackswipeCallback;

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

const logBackswipeCallback = (evt) => {
  evt.preventDefault();

  const background = document.getElementById("background");
  background.x = 0;

  document.location.replace('index.view').then(initIndex).catch((err) => {
    console.error(`Error loading index view - ${err.message}`);
  });
}  

export function init() {
  return document.location.assign('log.view');
}
