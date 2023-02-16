import { HeartRateSensor } from "heart-rate";
import { Accelerometer } from "accelerometer";
import {sum, diff, mean, abs} from "scientific";

export const getHeartRateSensor = (restMsg ) => {
    let hrm = new HeartRateSensor({ frequency: 1, batch: 30 });

    hrm.onreading = () => {
        let meanHr = mean(hrm.readings.heartRate);
        restMsg.heartRate = meanHr.toFixed(0).toString();
    }
    
    return hrm;
}

export const getAccelerometer = (restMsg) => {
    let accelerometer = new Accelerometer({ frequency: 10, batch:100});
    
    accelerometer.onreading = () => {
        let movementArray = new Float32Array([
            sum(diff(accelerometer.readings.x)),
            sum(diff(accelerometer.readings.y)),
            sum(diff(accelerometer.readings.z))
        ]);

        restMsg.movement = sum(abs(movementArray)).toFixed(2).toString();
    };

    return accelerometer;
}