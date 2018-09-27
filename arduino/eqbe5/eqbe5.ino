// Core Lib (Arduino)
#include<Wire.h>

// MyLib
#include "./_shared/MyNetwork.h"
#include "./_shared/MyOtaUpdate.h"
#include "./_shared/MySerial.h"

#define THING  "eqbe5"

// External Library
#define FASTLED_ESP8266_RAW_PIN_ORDER
#define FASTLED_ALLOW_INTERRUPTS 0  // To fix flickering issue https://github.com/FastLED/FastLED/issues/306
#include "FastLED.h"
FASTLED_USING_NAMESPACE

#define DATA_PIN    D5 // GPIO-14
#define MOSFET_PIN  D0 // GPIO-16

#define LED_TYPE    PL9823 // vs WS2812B
#define COLOR_ORDER RGB

#define BRIGHTNESS          60
#define DEFAULT_SPEED       100 // Range [0 to 1000]

#define FRAME_RATE 40          // 40 frame/s
#define FRAME_TIME (1000 / 40) // (1000 ms / 40 frames) = 25 ms / frame
#define RESOLUTION 1000        // 1000 div/s

#define EDGE_LEDS  5
#define NUM_LEDS   (EDGE_LEDS * EDGE_LEDS)
CRGB leds[NUM_LEDS];

enum patternEnum { SOLID, RAINBOW, CONFETTI, SINELON, BPM, JUGGLE, PATTERN_COUNT };
const char *patternName[PATTERN_COUNT] = { "solid", "rainbow", "confetti", "sinelon", "bpm", "juggle" };
typedef void (*SimplePatternList[])();
SimplePatternList gPatterns = { solid, rainbow, confetti, sinelon, bpm, juggle };
void (*gPattern)();

uint8_t gHue = 0;           // 0 <=> Red
uint8_t gSaturation = 255;
uint16_t gSpeed = DEFAULT_SPEED;

// Variables used in CheckAccel() routine
uint8_t MPU_addr = 0x68;
int16_t AcX, AcY, AcZ, Tmp, GyX, GyY, GyZ; //These will be the raw data from the MPU6050.;
#define ACCELEROMETER_ORIENTATION 4     // 0, 1, 2, 3 or 4 to set the orientation of the accerometer module
int a_forward = 0, a_sideway = 0, a_vertical = 0;
enum FACES { FACE_NONE, FACE_1, FACE_2, FACE_3, FACE_4, FACE_5, FACE_6, FACES_COUNT };
const char *faceName[FACES_COUNT] = { "None", "Face 1", "Face 2", "Face 3", "Face 4", "Face 5 (LEDs up)", "Face 6 (LEDs down)" };
uint8_t gFace = FACE_NONE;

void solid() {
  fill_solid(leds, NUM_LEDS, CHSV(gHue, gSaturation, 255));
}

void rainbow() {
#define DELTA_HUE 4
  fill_rainbow(leds, NUM_LEDS, gHue, DELTA_HUE);
}

void confetti() {
  fadeToBlackBy( leds, NUM_LEDS, 10);
  int pos = random16(NUM_LEDS);
  leds[pos] += CHSV(gHue + random8(64), 200, 255);
}

void sinelon() {
  fadeToBlackBy(leds, NUM_LEDS, 20);
  int pos = beatsin16(13, 0, NUM_LEDS - 1);
  leds[pos] += CHSV(gHue, 255, 192);
}

// Colored stripes pulsing at a defined Beats-Per-Minute (BPM)
void bpm() {
  uint8_t BeatsPerMinute = 62;
  CRGBPalette16 palette = PartyColors_p;
  uint8_t beat = beatsin8(BeatsPerMinute, 64, 255);
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = ColorFromPalette(palette, gHue + (i * 2), beat - gHue + (i * 10));
  }
}

// Eight colored dots, weaving in and out of sync with each other
void juggle() {
  fadeToBlackBy( leds, NUM_LEDS, 20);
  byte dothue = 0;
  for (int i = 0; i < 8; i++) {
    leds[beatsin16(i + 7, 0, NUM_LEDS - 1)] |= CHSV(dothue, 200, 255);
    dothue += 32;
  }
}

void setup() {
  pinMode(MOSFET_PIN, OUTPUT);
  digitalWrite(MOSFET_PIN, HIGH);

  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS);
  fill_solid(leds, NUM_LEDS, CHSV(HUE_GREEN, 255, 200));
  FastLED.setBrightness(BRIGHTNESS);
  FastLED.show();
  gPattern = solid;

  // Set up MPU 6050:
  Wire.begin();
#if ARDUINO >= 157
  Wire.setClock(400000UL); // Set I2C frequency to 400kHz
#else
  TWBR = ((F_CPU / 400000UL) - 16) / 2; // Set I2C frequency to 400kHz
#endif
  Wire.beginTransmission(MPU_addr);
  Wire.write(0x6B);  // PWR_MGMT_1 register
  Wire.write(0);     // set to zero (wakes up the MPU-6050)
  Wire.endTransmission(true);

  MySerial::setup();

  MyOtaUpdate::setup(THING);

  MyNetwork::setup(THING);
}

#define ACCEL_CHECK 500 // 500 ms, two time per sec
uint16_t accelInc = 0;

void loop() {
  MyOtaUpdate::loop();

  getPayload();

  EVERY_N_MILLISECONDS( FRAME_TIME ) {
    uint32_t inc = gSpeed * FRAME_TIME; // Increment (in division) = x div/ms * 25 ms
    gHue += inc / RESOLUTION;          // Step in unit (1 unit = 1000 div)
    inc = inc % RESOLUTION;            // Get rid of whole unit, keep remainder in 'div'

    gPattern();

    FastLED.show();

    accelInc += FRAME_TIME;
    if (accelInc > ACCEL_CHECK) {
      accelInc %= ACCEL_CHECK;
      CheckAccel();
    }
  }
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

      if (root["to"] == "eqbe5") {
        Serial.println("To MYSELF");

        if (root.containsKey("pattern")) {
          bool found = false;
          for (byte i; i < PATTERN_COUNT; ++i) {
            if (root["pattern"] == patternName[i]) {
              gPattern = gPatterns[i];
              Serial.printf("  Set Pattern to '%s'\n", patternName[i]);

              if (!gSaturation) {
                gSaturation = 255; // Reset to working value
                Serial.printf("  Reset saturation to default %d\n", gSaturation);
              }
              if (!gSpeed) {
                gSpeed = DEFAULT_SPEED; // Reset to a working default value
                Serial.printf("  Reset speed to default %d div/ms\n", gSpeed);
              }
              digitalWrite(MOSFET_PIN, HIGH); // Reset LED string need power, after a Brigthness 0

              found = true;
              break;
            }
          }
          if (!found) {
            Serial.printf("  WARNING! No pattern '%s'.\n", root["pattern"]);
          }
        }

        if (root.containsKey("hue")) {
          const uint8_t hue = root["hue"];
          gHue = hue;
          digitalWrite(MOSFET_PIN, HIGH); // LED string need power
          Serial.printf("  Set hue to %d\n", hue);
        }

        if (root.containsKey("saturation")) {
          const uint8_t saturation = root["saturation"];
          gSaturation = saturation;
          Serial.printf("  Set saturation to %d\n", saturation);
        }

        if (root.containsKey("speed")) {
          const uint16_t speed = root["speed"];
          gSpeed = speed;
          Serial.printf("  Set speed to %d div/ms (1000 div = 1 unit)\n", gSpeed);
        }

        if (root.containsKey("brightness")) {
          const uint8_t brightness = root["brightness"];
          if (brightness == 0) {
            digitalWrite(MOSFET_PIN, LOW);
          } else {
            FastLED.setBrightness(brightness);
            digitalWrite(MOSFET_PIN, HIGH);
          }
          Serial.printf("  Set brightness to %d\n", brightness);
        }
      }
    }
  }
}

void CheckAccel() {
  // Get accelerometer readings
  Wire.beginTransmission(MPU_addr);
  Wire.write(0x3B);  // starting with register 0x3B (ACCEL_XOUT_H)
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_addr, (size_t)14, true); // request a total of 14 registers
  AcX = Wire.read() << 8 | Wire.read(); // 0x3B (ACCEL_XOUT_H) & 0x3C (ACCEL_XOUT_L)
  AcY = Wire.read() << 8 | Wire.read(); // 0x3D (ACCEL_YOUT_H) & 0x3E (ACCEL_YOUT_L)
  AcZ = Wire.read() << 8 | Wire.read(); // 0x3F (ACCEL_ZOUT_H) & 0x40 (ACCEL_ZOUT_L)
  Tmp = Wire.read() << 8 | Wire.read(); // 0x41 (TEMP_OUT_H) & 0x42 (TEMP_OUT_L)
  GyX = Wire.read() << 8 | Wire.read(); // 0x43 (GYRO_XOUT_H) & 0x44 (GYRO_XOUT_L)
  GyY = Wire.read() << 8 | Wire.read(); // 0x45 (GYRO_YOUT_H) & 0x46 (GYRO_YOUT_L)
  GyZ = Wire.read() << 8 | Wire.read(); // 0x47 (GYRO_ZOUT_H) & 0x48 (GYRO_ZOUT_L)

  // Convert to expected orientation - includes unit conversion to "cents of g" for MPU range set to 2g
  a_forward = (ACCELEROMETER_ORIENTATION == 0 ? -AcX : (ACCELEROMETER_ORIENTATION == 1 ? -AcX : (ACCELEROMETER_ORIENTATION == 2 ? -AcX : (ACCELEROMETER_ORIENTATION == 3 ? -AcY : AcY)))) / 164.0;
  a_sideway = (ACCELEROMETER_ORIENTATION == 0 ? AcY : (ACCELEROMETER_ORIENTATION == 1 ? AcZ : (ACCELEROMETER_ORIENTATION == 2 ? -AcZ : (ACCELEROMETER_ORIENTATION == 3 ? AcZ : -AcZ)))) / 164.0;
  a_vertical = (ACCELEROMETER_ORIENTATION == 0 ? AcZ : (ACCELEROMETER_ORIENTATION == 1 ? -AcY : (ACCELEROMETER_ORIENTATION == 2 ? AcY : (ACCELEROMETER_ORIENTATION == 3 ? AcX : AcX)))) / 164.0;

  // Serial.printf("f: %d, s: %d, v: %d\n", a_forward, a_sideway, a_vertical);

  uint8_t face = FACE_NONE;

  if (a_vertical >= 80 && abs(a_forward) <= 25 && abs(a_sideway) <= 25) {
    face = FACE_1;
  } else if (a_forward >= 80 && abs(a_vertical) <= 25 && abs(a_sideway) <= 25) {
    face = FACE_2;
  } else if (a_vertical <= -80 && abs(a_forward) <= 25 && abs(a_sideway) <= 25) {
    face = FACE_3;
  } else if (a_forward <= -80 && abs(a_vertical) <= 25 && abs(a_sideway) <= 25) {
    face = FACE_4;
  } else if (a_sideway >= 80 && abs(a_vertical) <= 25 && abs(a_forward) <= 25) {
    face = FACE_5;
  } else if (a_sideway <= -80 && abs(a_vertical) <= 25 && abs(a_forward) <= 25) {
    face = FACE_6;
  }

  if (face != FACE_NONE) {
    if (face != gFace) {
      gFace = face;
      StaticJsonDocument<200> doc;
      JsonObject root = doc.to<JsonObject>();
      root["from"] = THING;
      root["to"] = "hub";
      root["accel"] = faceName[face];
      MyNetwork::sendJson(root);

      Serial.println(faceName[face]);
    }
  }
}
