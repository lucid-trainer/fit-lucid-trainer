import document from "document";

/**
 * Log view menu entry
 */

export function update() {
}

export function init() {
  console.log("log-view clicked");
  return document.location.assign('log.view');
}
