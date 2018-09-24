
#include "./_shared/MyNetwork.h"
#include "./_shared/MyOtaUpdate.h"
#include "./_shared/MySerial.h"

#define THING  "owl"

// -----------------------------------------------------------------------------------------
// Pin layout
// -----------------------------------------------------------------------------------------
// WittyCloud  Arduino  Purpose
// Pin Label   Pin
// -----------------------------------------------------------------------------------------
// GND         —        Ground
// VCC         —        +5V power
// REST        —        Reset
// CH_PD       —        Chip Power-Down
// TXD         TX       Serial interface
// RXD         RX       Serial interface
// GPIO0       D3       GPIO, flash-button
// GPIO2       D4       GPIO, blue LED on the ESP-Module

// ADC         A0       Analog input, LDR (Photoresistor)
// GPIO4       D2       GPIO, pushbutton
// GPIO15      D8       GPIO, red channel of RGB-LED
// GPIO12      D6       GPIO, green channel of RGB-LED
// GPIO13      D7       GPIO, blue channel of RGB-LED

// GPIO5       D1       GPIO, freely usable
// GPIO16      D0       GPIO, freely usable
// GPIO14      D5       GPIO, freely usable
// -----------------------------------------------------------------------------------------

#define LDR_PIN     A0  // Value 0 to 1023 (0 no light, 1023 lot of light)
#define BUTTON_PIN  D2

#define RGB_RED_PIN    D8 // Value 0 to 1023 (0 not lit, 1023 max lit)
#define RGB_GREEN_PIN  D6
#define RGB_BLUE_PIN   D7

void setup() {
  MySerial::setup();

  // OTA Update
  MyOtaUpdate::setup(THING);

  MyNetwork::setup(THING);
}

uint16_t seq = 0;


int16_t ldrVal = 0;       // Value: 0 to 1023 (0 no light, 1023 lot of light)
int16_t _ldrVal = 1; // store latest val (Diff to force send of a change)

int8_t buttonVal = HIGH;        // Value: HIGH or LOW
int8_t _buttonVal = LOW;  // store tmp value (Diff to force sending value)

#define TIME_SPAN  250 // 1/4 sec
uint32_t milestone = millis() + TIME_SPAN;

void loop() {
  MyOtaUpdate::loop();

  getPayload();

  _ldrVal = analogRead(LDR_PIN);
  _buttonVal = digitalRead(BUTTON_PIN);

  if (millis() > milestone) {
    milestone += TIME_SPAN;

    if (_ldrVal != ldrVal && abs(_ldrVal = ldrVal) > 50) {
      ldrVal = _ldrVal;

      StaticJsonDocument<150> doc;
      JsonObject root = doc.to<JsonObject>();
      root["seq"] = ++seq;
      root["from"] = THING;
      root["to"] = "hub";
      root["ldr"] = ldrVal;

      MyNetwork::sendJson(root);

      // Serial.printf("LDR: %d\n", ldrVal);
    }

    if (_buttonVal != buttonVal) {
      buttonVal = _buttonVal;

      StaticJsonDocument<150> doc;
      JsonObject root = doc.to<JsonObject>();
      root["seq"] = ++seq;
      root["from"] = THING;
      root["to"] = "hub";
      root["button"] = buttonVal;

      MyNetwork::sendJson(root);

      // Serial.printf("Button: %d\n", buttonVal);
    }
  }

  delay(100);
}

void getPayload () {
  int payloadSize = udp.parsePacket();
  if (payloadSize) {
    StaticJsonDocument<200> doc;

    char payload[255];
    int len = udp.read(payload, 255);
    if (len > 0) {
      payload[len] = 0;
    }
    Serial.printf("UDP payload: '%s'\n", payload);

    DeserializationError error = deserializeJson(doc, payload);
    if (error) {
      Serial.println(error);
    } else {
      JsonObject root = doc.as<JsonObject>();

      if (root["to"] == "owl") {
        processPayload(root);
        Serial.println("MINE");

      }
    }
  }
}

void processPayload (JsonObject root) {
  int16_t r = root["r"];
  int16_t g = root["g"];
  int16_t b = root["b"];

  Serial.printf("RGB = %d, %d, %d\n", r, g, b);

  analogWrite(RGB_RED_PIN, r);
  analogWrite(RGB_GREEN_PIN, g);
  analogWrite(RGB_BLUE_PIN, b);
}
