#include "./_shared/MyNetwork.h"
#include "./_shared/MyOtaUpdate.h"
#include "./_shared/MySerial.h"

#define THING  "rfid"

#include <SPI.h>
#include <MFRC522.h>

#define MAIN_LOOP_DELAY  200    // In milli-seconds
#define REPEAT_THRESHOLD  600 // In milli-seconds (MFRC522 send back card info every 400 ms)

#define IRQ_PIN  D2
#define RST_PIN  D3
#define SS_PIN   D8

// -----------------------------------------------------------------------------------------
// Pin layout
// -----------------------------------------------------------------------------------------
//             MFRC522      ESP8266    Arduino
//             Reader/PCD   NodeMCU    Framework
// Signal      Pin          Pin        Pin
// -----------------------------------------------------------------------------------------
// RST/Reset   RST          D3         GPIO-0
// SPI SS      SDA(NSS)     D8         BPIO-15
// IRQ         IRQ          D2         GPIO-4
// SPI MOSI    MOSI         D7 (MOSI)  GPIO-13
// SPI MISO    MISO         D6 (MISO)  GPIO-12
// SPI SCK     SCK          D5 (SCLK)  GPIO-
// -----------------------------------------------------------------------------------------

// MFRC522 Bit for Register `ComIEnReg`
#define IRQINV_BIT  7  // Invert Status1Reg IRq bit
#define RXIEN_BIT   5  // Allow RxIRq propagated to ping IRQ

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

volatile uint8_t irqRxCount = 0;
uint8_t  rxCount = 0;
uint32_t before = - (REPEAT_THRESHOLD + 1); // At init time, outdate 'before' to be over threshold.

void setup() {
  MySerial::setup();

  // OTA Update
  MyOtaUpdate::setup(THING);

  MyNetwork::setup(THING);

  // NXP MFRC522 -- Contactless Reader IC -- PCD(Proximity Coupling Device):
  SPI.begin();          // Init SPI bus
  mfrc522.PCD_Init();   // Init MFRC522
  Serial.print("MFRC522 ");
  mfrc522.PCD_DumpVersionToSerial();

  // MFRC522: Enabled IRQ on Rx
  mfrc522.PCD_WriteRegister(mfrc522.ComIEnReg, (1 << IRQINV_BIT | 1 << RXIEN_BIT));

  // ESP8266: Setup IRQ Handler
  pinMode(IRQ_PIN, INPUT_PULLUP);                                      // Setup IRQ Pin
  attachInterrupt(digitalPinToInterrupt(IRQ_PIN), rxHandler, FALLING); // Activate interrupt
}

uint16_t seq = 0;

void loop() {
  MyOtaUpdate::loop();

  if (irqRxCount != rxCount) {
    Serial.printf("IrqRxCount: %d\n", irqRxCount);

    uint32_t elapsed = millis() - before;
    before = millis();

    if (elapsed < REPEAT_THRESHOLD) {
      Serial.printf("Skip. (Same card, since less than 600 ms, got %d ms)\n", elapsed);
    } else {
      if ( mfrc522.PICC_ReadCardSerial()) {
        StaticJsonDocument<200> doc;
        JsonObject root = doc.to<JsonObject>();
        root["seq"] = ++seq;
        root["from"] = THING;
        root["to"] = "hub";
        JsonArray rfid = root.createNestedArray("rfid");
        rfid.copyFrom(mfrc522.uid.uidByte, mfrc522.uid.size);
        MyNetwork::sendJson(root);


        // mfrc522.PICC_DumpToSerial(&(mfrc522.uid));
        Serial.print("RFID UID < ");
        for (byte i = 0; i < mfrc522.uid.size; ++i) {
          Serial.printf("%02X ", mfrc522.uid.uidByte[i]);
        }
        Serial.println(">");
      }
    }

    rxCount = irqRxCount;
    //Serial.printf("rxCount: %d\n", rxCount);

    mfrc522.PCD_WriteRegister(mfrc522.ComIrqReg, 0x7F); // Clear any pending IRQ bit
  }

  // Command to Activate MFRC522 Rx
  mfrc522.PCD_WriteRegister(mfrc522.FIFODataReg, mfrc522.PICC_CMD_REQA);
  mfrc522.PCD_WriteRegister(mfrc522.CommandReg, mfrc522.PCD_Transceive);
  mfrc522.PCD_WriteRegister(mfrc522.BitFramingReg, 0x87);

  delay(MAIN_LOOP_DELAY);
}

void rxHandler() {
  irqRxCount += 1;
}
