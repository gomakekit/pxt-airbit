
/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */

// This code is currently for internal use only, 
// not to be shared or published without written agreement with Henning Pedersen

enum PingUnit {
    //% block="μs"
    MicroSeconds,
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches
}

/**
 * makecode BMP280 digital pressure sensor Package.
 * From microbit/micropython Chinese community.
 * http://www.micropython.org.cn
 */



/**
 * Custom blocks
 */
//% weight=100 color=#0040ff icon=""
namespace AirBit {
    /**
     * Set of code blocks for the Drone
     */


    //% block
    export function getBatteryVoltage(): number {
        let telemetriBuffer = pins.createBuffer(24)

        /**
         * 
         * Get the battery voltage from flight controller (telemetry data) 
         * 
         */
        let BattVoltage = 0
        telemetriBuffer = serial.readBuffer(10)
        for (let index = 0; index <= 10; index++) {
            if (telemetriBuffer[index] == 83) {
                BattVoltage = telemetriBuffer[index + 2] * 256 + telemetriBuffer[index + 1]
            }
        }
        return BattVoltage
    }


    //% block
    export function echoStart(trig: DigitalPin): number {
        /** 
         * Send an echo signal to the Sonar, use echoGetCm to read the result
         */

        // send pulse
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);
        return input.runningTimeMicros()
    }


    //% block
    export function echoGetCm(eTime: number, unit: PingUnit): number {
        /**
         * We recommend to run this block in an OnPulsed (interrupt) command.
         */
        let eDist = (input.runningTimeMicros() - eTime)
        //    return (input.runningTimeMicros() / 58)
        switch (unit) {
            case PingUnit.Centimeters: return eDist / 58;
            case PingUnit.Inches: return eDist / 148;
            default: return eDist;
        }
    }





    //% block
    export function blinkXLine(x1: number, x2: number, y: number, speed: number): void {
        /**
         * Draw a blinking line along an X axis with speed 0-7
         */
        if (((input.runningTime() >> (12 - speed) & 1)) == 1) {
            for (let x = x1; x <= x2; x++) {
                led.plot(x, y)
            }
        }
    }

    //% block
    export function blinkYLine(y1: number, y2: number, x: number, speed: number): void {
        /**
         * Draw a blinking line along the Y axis with speed 0-7
         */
        if (((input.runningTime() >> (12 - speed) & 1)) == 1) {
            for (let y = y1; y <= y2; y++) {
                led.plot(x, y)
            }
        }
    }

    //% block
    export function plotYLine(y1: number, y2: number, x: number): void {
        /**
         * Draw a line along the Y axis. y1: first pixel, y2: last pixel
         */

        if (y1 >= y2) {
            for (let y = y2; y <= y1; y++) {
                led.plot(x, y)
            }
        }
        else if (y1 < y2) {
            for (let y = y1; y <= y2; y++) {
                led.plot(x, y)
            }
        }
    }


    //% block
    export function plotXLine(x1: number, x2: number, y: number): void {
        /**
        * Draw a line along the X axis
        */
        if (x1 >= x2) {
            for (let x = x2; x <= x1; x++) {
                led.plot(x, y)
            }
        }
        else if (x1 < x2) {
            for (let x = x1; x <= x2; x++) {
                led.plot(x, y)
            }
        }
    }







    //% block
    export function blinkLed(x: number, y: number, speed: number): void {
        /**
         * Plot a blinking led at x,y with speed 0-7
         */
        if (((input.runningTime() >> (12 - speed) & 1)) == 1) {
            led.plot(x, y)
        }

    }

    //%block
    export function rotateDotCw(speed: number): void {
        /**
         * Draw a dot that is rotating in a clockwise manner with chosen speed
         */
        let posisjon = (input.runningTime() >> (12 - speed)) & 15
        posisjon = pins.map(
            posisjon,
            0,
            15,
            1,
            12
        )
        if (posisjon == 1) {
            led.plot(1, 0)
        }
        if (posisjon == 2) {
            led.plot(2, 0)
        }
        if (posisjon == 3) {
            led.plot(3, 0)
        }
        if (posisjon == 4) {
            led.plot(4, 1)
        }
        if (posisjon == 5) {
            led.plot(4, 2)
        }
        if (posisjon == 6) {
            led.plot(4, 3)
        }
        if (posisjon == 7) {
            led.plot(3, 4)
        }
        if (posisjon == 8) {
            led.plot(2, 4)
        }
        if (posisjon == 9) {
            led.plot(1, 4)
        }
        if (posisjon == 10) {
            led.plot(0, 3)
        }
        if (posisjon == 11) {
            led.plot(0, 2)
        }
        if (posisjon == 12) {
            led.plot(0, 1)
        }
        // Add code here
    }


    //% block="flightcontrol|Throttle $Throttle|Yaw $Yaw|Pitch $Pitch|Roll $Roll|Arm $Arm|Servo 1 $Aux1|Servo 2 $Aux2"
    export function FlightControl(Throttle: number, Yaw: number, Pitch: number, Roll: number, Arm: number, Aux1: number, Aux2: number): void {
        /**
         * Control TYPR12 (Throttle, Yaw, Pitch, Roll and AUX1 and AUX2) using the Spektsat 2048 protocol
         * Throttle min: 0, max: 100
         * Yaw, Pitch Roll: min -90, max 90
         * Arm: 0 = Disarm, 1 = Arm 
         * Aux1: 0 - 180
         * Aux2: 0 - 180
         */
        let buf = pins.createBuffer(16)
        let scaling = 1023 / 180
        let offset = 512
        // Header "Fade" (Spektsat code)
        buf[0] = 0
        // Header "System" (Spektsat code)  
        buf[1] = 0x01
        // 0x01 22MS 1024 DSM2 
        // 0x12 11MS 2048 DSM2
        // 0xa2 22MS 2048 DSMS 
        // 0xb2 11MS 2048 DSMX

        // Reverse the pitch 
        Pitch = - Pitch

        // Upscale Arm (Arm = true or false)
        let armS = 0
        if (Arm == 0) {
            armS = 0
        }

        if (Arm == 1) {
            armS = 180 * scaling
        }

        // Aux  limit
        if (Aux1 > 180) {
            Aux1 = 180
        }
        if (Aux1 < 0) {
            Aux1 = 0
        }

        if (Aux2 > 180) {
            Aux2 = 180
        }
        if (Aux2 < 0) {
            Aux2 = 0
        }

        if (Throttle > 99) {
            Throttle = 99
        }
        if (Throttle < 0) {
            Throttle = 0
        }
        if (Yaw > 90) {
            Yaw = 90
        }
        if (Yaw < -90) {
            Yaw = -90
        }
        if (Pitch > 90) {
            Pitch = 90
        }
        if (Pitch < -90) {
            Pitch = -90
        }
        if (Roll > 90) {
            Roll = 90
        }
        if (Roll < -90) {
            Roll = -90
        }

        let pitchS = Pitch * scaling + offset
        let rollS = Roll * scaling + offset
        let yawS = Yaw * scaling + offset
        let throttleS = (Throttle * 512) / 50
        let aux1S = Aux1 * scaling
        let aux2S = Aux2 * scaling

        buf[2] = (0 << 2) | ((rollS >> 8) & 3)
        buf[3] = rollS & 255
        buf[4] = (1 << 2) | ((pitchS >> 8) & 3)
        buf[5] = pitchS & 255
        buf[6] = (2 << 2) | ((throttleS >> 8) & 3)
        buf[7] = throttleS & 255
        buf[8] = (3 << 2) | ((yawS >> 8) & 3)
        buf[9] = yawS & 255
        buf[10] = (4 << 2) | ((armS >> 8) & 3)
        buf[11] = armS & 255
        buf[12] = (5 << 2) | ((aux1S >> 8) & 3)
        buf[13] = aux1S & 255
        buf[14] = (6 << 2) | ((aux2S >> 8) & 3)
        buf[15] = aux2S & 255
        serial.writeBuffer(buf)


    }

}





