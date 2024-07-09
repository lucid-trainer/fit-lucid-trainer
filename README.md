# Fitbit Lucid Trainer

A Fitbit SDK 5.0 App to capture sleep related data and send to an external REST service. UI built upon examples in [sdk-app-demo](https://github.com/Fitbit/sdk-app-demo). 

The goal of this project is to provide access to real-time data for use by the lucid-trainer android app. The app can be built and sideloaded onto the Sense and Versa 3. It may work with the Sense 2 and Versa 4 as well but it's unclear currently if those watches will support custom apps. 

The app provides a simple menu with the option to start a standard or training session. Views are exited by swiping the screen from left to right.

![Screenshot](screenshot.png)

The session view provides a toggle button to start/stop an active capture session. During the session, a batch sampling of accelerometer, heart rate and the sleep sensor data is taken and averaged on a time increment (defaulting to every one minute) and then posted to a REST service (defaulting to the test service https://httpbin.org). The view provides feedback about the state of the connection with the service and the session duration. Swiping the screen right brings up a secondary screen that allows for sending events to the android app to play sound routines.  The user can also use the Sleep button to stop playback or interrupt prompting from the android app. Shorter pausing of prompting is performed by moving the watch a few times, such as with a few twisting motions of the wrist.

![Screenshot](session-screenshot.png)

An example of the REST payload posted to the server, which will be returned in the response if using httpbin.

```
{
  "positionArray": [
    {
      "x": "-7.4755",
      "y": "4.1957",
      "z": "4.7651"
    },
    {
      "x": "-7.1996",
      "y": "0.0274",
      "z": "7.1460"
    }
  ],
  "hr": "67",
  "hrVar": "0.8477",
  "hrArray": "66,66,66,67,67,67,67,66,66,66,66,67,67,67,68,68,69,70,71,70,69,68,68,68,68,68,67,66,66,66",
  "event": "playsound.w,",
  "sessionId": "lye4c0vvxsy6eyzv9l",
  "timestamp": "2024-07-09T04:00:14.284",
  "isSleep": "awake",
  "move": "1.94",
  "moveZ": "0.71"
}
```

# Getting Started

The app can be built and deployed to a device using the Fitbit Command Line Interface. The [Command Line Interface Guide](https://dev.fitbit.com/build/guides/command-line-interface/) provides all the steps needed to get set up. The main prerequisites include a Fitbit account with free developer access, installing node.js and performing an npm install in the root directory of the project. It is also useful to install a source code editor like [Microsoft VSCode](https://code.visualstudio.com/).

One limitation on REST calls from Fitbit watches is that the endpoint must support https and have a valid signed cert. An easy solution for that which also makes the data accessible quickly is to use [MongoDB Atlas](https://www.mongodb.com/atlas). You can sign up for the free Shared version and begin recording data in a few minutes. Easy configuration setup in the app is supported in the rest.js file. Once the data is in Atlas, you can work with it as is or import it into a local database with [MongoDB Compass](https://www.mongodb.com/products/compass) or a similar client application. 

## License

This application is licensed under the [MIT License](./LICENSE).
