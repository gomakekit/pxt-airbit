input.onButtonPressed(Button.AB, function () {

})
function iconBatteryLow2() {
    basic.showLeds(`
            . . # . .
            . # # # .
            . # . # .
            . # . # .
            . # # # .
            `, 0)
}
input.onButtonPressed(Button.A, function () {
    buzzer = 1
    basic.pause(500)
    buzzer = 0
})
function calculateBatteryVoltage() {
    batteryMilliVolt = Math.round(pins.analogReadPin(AnalogPin.P0) * batteryFactor * 0.05 + batteryMilliVolt * 0.95)
}
function iconBatteryDead() {
    basic.showLeds(`
        . # # # .
        # . # . #
        # # # # #
        . # . # .
        . # . # .
        `)
}
serial.onDataReceived(serial.delimiters(Delimiters.Dollar), function () {
    TLMreceived = input.runningTime()
})
function iconBatteryCharging() {
    basic.showLeds(`
        . . # . .
        . # . # .
        . # . # .
        . # . # .
        . # # # .
        `)
    basic.showLeds(`
        . . # . .
        . # . # .
        . # . # .
        . # # # .
        . # # # .
        `)
    basic.showLeds(`
        . . # . .
        . # . # .
        . # # # .
        . # # # .
        . # # # .
        `)
    basic.showLeds(`
        . . # . .
        . # # # .
        . # # # .
        . # # # .
        . # # # .
        `)
}
input.onGesture(Gesture.ScreenDown, function () {
    arm = 0
})
function mainScreen() {
    if (arm == 1) {
        if (input.runningTime() % 500 > 250) {
            led.plot(0, 0)
        }
    }
    led.plot(0, (100 - throttle) / 25)
    led.plot((45 + roll) / 18, (45 + pitch) / 18)
    led.plot(Math.map(yaw, -30, 30, 1, 3), 0)
    if (batteryMilliVolt > 100) {
        if (arm == 1) {
            AirBit.plotYLine(4, Math.round(Math.map(batteryMilliVolt, 3400, 3900, 4, 0)), 4)
        } else {
            AirBit.plotYLine(4, Math.round(Math.map(batteryMilliVolt, 3700, 4200, 4, 0)), 4)
        }
    } else {
        if (input.runningTime() % 500 > 250) {
            led.plot(4, 4)
        }
    }
}
function calibrateAcc() {
    basic.showString("C")
    for (let i = 0; i < 20; i++) {
        AirBit.FlightControl(
            99,
            -90,
            90,
            0,
            0,
            0,
            0
        )
        basic.pause(20)
    }
    basic.pause(2000)
}
radio.onReceivedValueDeprecated(function (name, value) {
    if (name == "P") {
        pitch = value
    }
    if (name == "A") {
        arm = value
    }
    if (name == "R") {
        roll = value
    }
    if (name == "T") {
        throttle = value
    }
    if (name == "Y") {
        yaw = value
    }
    failSafeCounter = input.runningTime()
})
function failSafe() {
    if (input.runningTime() > failSafeCounter + 1000) {
        throttle = 30
        yaw = 0
        pitch = 0
        roll = 0
    }
    if (input.runningTime() > failSafeCounter + 5000) {
        arm = 0
    }
}
function lowBattery() {
    if (batteryEmpty || batteryMilliVolt <= lowBatteryLimit - 60) {
        buzzer = 1
        throttle = 0
        arm = 0
        batteryEmpty = true
        iconBatteryDead()
    } else if (batteryMilliVolt <= lowBatteryLimit - 50) {
        buzzer = 1
        throttle = Math.constrain(throttle, 0, 45)
        if (input.runningTime() % 1000 > 850) {
            iconBatteryLow2()
        }
    } else {
        if (input.runningTime() % 1000 > 850) {
            buzzer = 1
        } else {
            buzzer = 0
        }
        iconBatteryLow2()
    }
}
function startSonar() {
    echoStart = AirBit.echoStart(DigitalPin.P0)
    pins.setEvents(DigitalPin.P0, PinEventType.Pulse)
}
let echoStart = 0
let failSafeCounter = 0
let yaw = 0
let pitch = 0
let roll = 0
let throttle = 0
let arm = 0
let TLMreceived = 0
let batteryEmpty = false
let batteryMilliVolt = 0
let buzzer = 0
let lowBatteryLimit = 0
let batteryFactor = 0
let radioGroup = 16
basic.showNumber(radioGroup)
batteryFactor = 4.42
lowBatteryLimit = 3450
buzzer = 0
batteryMilliVolt = 3700
batteryEmpty = false
TLMreceived = -5000
radio.setGroup(radioGroup)
serial.redirect(
    SerialPin.P1,
    SerialPin.P2,
    BaudRate.BaudRate115200
)
basic.forever(function () {
    calculateBatteryVoltage()
    batteryEmpty = false
    basic.clearScreen()
    if (pins.analogReadPin(AnalogPin.P0) < 600 && pins.analogReadPin(AnalogPin.P0) >= 400) {
        iconBatteryCharging()
    } else if (batteryEmpty || batteryMilliVolt < lowBatteryLimit && pins.analogReadPin(AnalogPin.P0) > 300) {
        lowBattery()
    } else {
        mainScreen()
        buzzer = 0
    }
    failSafe()
    if (batteryEmpty) {
        arm = 0
    }
    AirBit.FlightControl(
        throttle,
        yaw,
        pitch,
        roll,
        arm,
        0,
        0
    )
    radio.sendValue("B", batteryMilliVolt)
    radio.sendValue("A", pins.analogReadPin(AnalogPin.P0))
})
