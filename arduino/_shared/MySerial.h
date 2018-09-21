#ifndef MySerial_h
#define MySerial_h

#define SERIAL_SPEED     115200  // Baud rate (bit/s)

// For debug only (show bootloader message).
// Very hard to get it working, use external program 'anybaud' in ./_tools
// #define SERIAL_SPEED 74880

class MySerial {
    public:

    static void setup () {
        Serial.begin(SERIAL_SPEED);
        while (!Serial) {
            ; // Wait
        }

        // Espressif ESP8266
        Serial.println();
        Serial.printf("ESP8266 Arduino Core version %s\n", ESP.getCoreVersion().c_str());
        Serial.printf("Free Sketch Space %d\n", ESP.getFreeSketchSpace() / 1024);
        Serial.println();
    }

    static void loop () {
        ArduinoOTA.handle();
    }
};

#endif
