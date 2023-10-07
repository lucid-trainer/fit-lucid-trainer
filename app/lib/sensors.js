import { HeartRateSensor } from "heart-rate";
import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
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

// An instance of the filter for each axis of gyroscope
const gyroFilter5hzX = new LinearFilter(coeffB, coeffA);
const gyroFilter5hzY = new LinearFilter(coeffB, coeffA);
const gyroFilter5hzZ = new LinearFilter(coeffB, coeffA);

// An instance of the filter for each axis of accelerometer
const accelFilter5hzX = new LinearFilter(coeffB, coeffA);
const accelFilter5hzY = new LinearFilter(coeffB, coeffA);
const accelFilter5hzZ = new LinearFilter(coeffB, coeffA);


export const getHeartRateSensor = (restMsg ) => {
    //1 readings per second, callback every 30 seconds
    let hrm = new HeartRateSensor({ frequency: 1, batch: 30 });

    hrm.onreading = () => {

        let filterHeartRateReadings = smooth(hrm.readings.heartRate, .85);

        let meanHr = mean(hrm.readings.heartRate);
        restMsg.hr = meanHr.toFixed(0);
        
        restMsg.hrVar = std(filterHeartRateReadings).toFixed(4);

        //include the raw heart rate readings
        restMsg.hrArray = getNumberArrayFromFloat(hrm.readings.heartRate, 0).join();
    };

    
    return hrm;
}

export const getGyroscope = (restMsg) => {
    //1 readings per second, callback every 30 seconds
    let gyroscope = new Gyroscope({ frequency: 1, batch: 30});
    
    gyroscope.onreading = () => {
        //include the raw heart rate readings
        restMsg.gyrox = getNumberArrayFromFloat(gyroscope.readings.x,4).join();
        restMsg.gyroy = getNumberArrayFromFloat(gyroscope.readings.y,4).join();
        restMsg.gyroz = getNumberArrayFromFloat(gyroscope.readings.z,4).join();

        restMsg.gyromove = getGyroMovement(gyroscope);
    }

    return gyroscope
}

export const getAccelerometer = (restMsg) => {
    //1 readings per second, callback every 30 seconds
    let accelerometer = new Accelerometer({ frequency: 1, batch: 30});
    
    accelerometer.onreading = () => {
        //include the raw heart rate readings
        restMsg.accelx = getNumberArrayFromFloat(accelerometer.readings.x,4).join();
        restMsg.accely = getNumberArrayFromFloat(accelerometer.readings.y,4).join();
        restMsg.accelz = getNumberArrayFromFloat(accelerometer.readings.z,4).join();

        restMsg.accelmove = getAccelMovement(accelerometer);
    }

    return accelerometer
}

function getGyroMovement(gyroscope) {

    let chunksx = sliceIntoChunks(gyroscope.readings.x, 10);
    let chunksy = sliceIntoChunks(gyroscope.readings.y, 10);
    let chunksz = sliceIntoChunks(gyroscope.readings.z, 10);

    let xVals = chunksx.map(chunkx => gyroFilter5hzX.update(chunkx)[0]);
    let yVals = chunksy.map(chunky => gyroFilter5hzY.update(chunky)[0]);
    let zVals = chunksz.map(chunkz => gyroFilter5hzZ.update(chunkz)[0]);

    return sum(new Float32Array(
        ...abs(diff(new Float32Array(xVals))),
        ...abs(diff(new Float32Array(yVals))),
        ...abs(diff(new Float32Array(zVals))))
    ).toFixed(4);
}

function getAccelMovement(accelerometer) {

    let chunksx = sliceIntoChunks(accelerometer.readings.x, 10);
    let chunksy = sliceIntoChunks(accelerometer.readings.y, 10);
    let chunksz = sliceIntoChunks(accelerometer.readings.z, 10);

    let xVals = chunksx.map(chunkx => accelFilter5hzX.update(chunkx)[0]);
    let yVals = chunksy.map(chunky => accelFilter5hzY.update(chunky)[0]);
    let zVals = chunksz.map(chunkz => accelFilter5hzZ.update(chunkz)[0]);

    return sum(new Float32Array(
        ...abs(diff(new Float32Array(xVals))),
        ...abs(diff(new Float32Array(yVals))),
        ...abs(diff(new Float32Array(zVals))))
    ).toFixed(4);
}

//convert a Float32Array to Number Array
function getNumberArrayFromFloat(floatArray, precision) {
    var numArray = [];
    for (var i in floatArray) {
        var num = Number(floatArray[i]).toFixed(precision);
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

function sliceIntoChunks(data, length) {
    var result = [];
    for (var i = 0; i < data.length; i += length) {
        result.push(data.subarray(i, i + length));
    }
    return result;
}
