import { HeartRateSensor } from "heart-rate";
import { Accelerometer } from "accelerometer";
import {sum, diff, mean, abs, std} from "scientific";
import { LinearFilter } from "scientific/signal";

// 5hz lowpass butterworth filter
const coeffA = new Float32Array([
1,
-2.37409474,
1.92935567,
-0.53207537
]);
const coeffB = new Float32Array([
0.00289819,
0.00869458,
0.00869458,
0.00289819
]);

// An instance of the filter for each axis
const filter5hzX = new LinearFilter(coeffB, coeffA);
const filter5hzY = new LinearFilter(coeffB, coeffA);
const filter5hzZ = new LinearFilter(coeffB, coeffA);

export const getHeartRateSensor = (restMsg ) => {
    //1 readings per second, callback every 30 seconds
    let hrm = new HeartRateSensor({ frequency: 1, batch: 30 });

    hrm.onreading = () => {

        let filterHeartRateReadings = smooth(hrm.readings.heartRate, .85);

        let meanHr = mean(hrm.readings.heartRate);
        restMsg.hr = meanHr.toFixed(0);
        
        restMsg.hrVar = std(filterHeartRateReadings).toFixed(2);

        //include the raw heart rate readings
        restMsg.hrArray = getNumberArrayFromFloat(hrm.readings.heartRate);
    };

    
    return hrm;
}

export const getAccelerometer = (restMsg) => {
    //100 readings per second, callback every 10th of a second
    let accelerometer = new Accelerometer({ frequency: 100, batch: 10});
    
    accelerometer.onreading = () => {
        processAccelReadings(accelerometer, restMsg);
    };

    return accelerometer;
}

function processAccelReadings(accelerometer, restMsg) {
    let moveArray = restMsg.moveArray || [];
    let positionArray = restMsg.positionArray || [];

    //use the filter to get a current reading
    let filtX = filter5hzX.update(accelerometer.readings.x)[0];
    let filtY = filter5hzY.update(accelerometer.readings.y)[0];
    let filtZ = filter5hzZ.update(accelerometer.readings.z)[0];

    let currPosition = {
        x: filtX.toFixed(4),
        y: filtY.toFixed(4),
        z: filtZ.toFixed(4)
    };

    let prevPosition = positionArray.slice(-1)[0];

    //This array should end up containing the starting and ending value for a recording
    if (positionArray.length < 2) {
        positionArray.push(currPosition);
    } else {
        positionArray[1] = currPosition;
    }

    //calculate difference between each
    if(prevPosition)  {
        let postDiff = sum(new Float32Array([
            abs(diff(new Float32Array([prevPosition.x, currPosition.x]))),
            abs(diff(new Float32Array([prevPosition.y, currPosition.y]))),
            abs(diff(new Float32Array([prevPosition.z, currPosition.z])))])
        ).toFixed(2);

        moveArray.push(postDiff);
    }

    //update the fields on the restMsg object
    restMsg.positionArray = positionArray;
    restMsg.moveArray = moveArray;
}

//convert a Float32Array to Number Array
function getNumberArrayFromFloat(floatArray) {
    var numArray = [];
    for (var i in floatArray) {
        var num = Number(floatArray[i]);
        numArray.push(num); 
    }
    return numArray;
}


function smooth(values, alpha) {
    var weighted = average(values) * alpha;
    var smoothed = [];
    for (var i in values) {
        var curr = values[i];
        var prev = smoothed[i - 1] || values[values.length - 1];
        var next = curr || values[0];
        var improved = Number(average([weighted, prev, curr, next]).toFixed(2));
        smoothed.push(improved);
    }
    return new Float32Array(smoothed);
}

function average(data) {
    var sum = data.reduce(function(sum, value) {
        return sum + value;
    }, 0);
    var avg = sum / data.length;
    return avg;
}