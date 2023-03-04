# Fitbit Lucid Trainer

A Fitbit SDK 5.0 App to capture sleep related data and send to an external REST service. UI built upon examples in [sdk-app-demo](https://github.com/Fitbit/sdk-app-demo). 

The goal of this project is to provide access to real-time data to develop a customized algorithm for identifying REM sleep state. Future updates will add a lucid dreaming induction option via vibration. The app can be built and side loaded onto the Sense and should also work with the Versa 3. It may work with the Sense 2 and Versa 4 as well but it's unclear currently if those watches will support custom apps. 

The app provides a simple menu with the option to start a session or view a log of recent activity. Views are exited by swiping the screen from left to right.

![Screenshot](screenshot.png)

The session view provides a toggle button to start/stop an active capture session. During the session, a batch sampling of accelerometer, heart rate and the sleep sensor data is taken and averaged on a time increment (defaulting to every one minute) and then posted to a REST service (defaulting to the test service https://httpbin.org). The view provides feedback about the state of the connection with the service and the session duration. The user can also use the Dream button to signal waking from a recent dream.

![Screenshot](session-screenshot.png)

An example of the REST payload posted to the server, which will be returned in the response if using httpbin.

```{"movement":"0.20","heartRate":"76","sessionId":"lernckvn6iimnuppen9","timestamp":1677794323721,"isSleep":"awake"}```

# Getting Started

The app can be built and deployed to a device using the Fitbit Command Line Interface. The [Command Line Interface Guide](https://dev.fitbit.com/build/guides/command-line-interface/) provides all the steps needed to get set up. The main prerequisites include a Fitbit account with free developer access, installing node.js and performing an npm install in the root directory of the project. It is also useful to install a source code editor like [Microsoft VSCode](https://code.visualstudio.com/).

## License

This application is licensed under the [MIT License](./LICENSE).
