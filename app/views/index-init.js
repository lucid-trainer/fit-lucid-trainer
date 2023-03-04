import document from "document";

/**
 * Handlers for the tile list buttons. Each button navigates to a different scenario
 * involving multiple views.
 */
const buttonCallbacks = [
    ["session-view/start",  () => import("./session")],
    ["log-view/start",   () => import("./log")],
  ];
  
/**
 * Assign button click handlers for all items in the menu. The view's
 * associated JavaScript is loaded and executed, and the new view is loaded on
 * top of the current one.
 */
export const initIndex = () => {
    buttonCallbacks.forEach((view) => {
    const [buttonID, viewJSLoader] = view;

    document.getElementById(buttonID).addEventListener("click", () => {
        viewJSLoader().then(({ init, update }) => {
        init().then(update).catch((err) => {
            console.error(`Error loading view: ${err.message}`);
        });
        }).catch((err) => {
            console.error(`Failed to load view JS: ${buttonID} - ${err.message}`);
        });
    });
    });

    document.onbeforeunload = (evt) => {
        evt.preventDefault();
        
        const background = document.getElementById("background");
        background.x = 0;
    }
}