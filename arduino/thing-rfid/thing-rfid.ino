#include <ESP8266WiFi.h>

#include <SPI.h>
#include <MFRC522.h>

#include <ESP8266mDNS.h>
#include <ArduinoOTA.h>

#include "./_shared/MyOtaUpdate.h"
#include "./_shared/MyNetworkSetup.h"

#define SERIAL_SPEED     115200  // Baud rate (bit/s)
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
  Serial.begin(SERIAL_SPEED);
  while (!Serial) {
    ; // Wait
  }
  Serial.println("\nSerial OK");

  Serial.printf("UDP Port: %d\n", UDP_PORT);

  Serial.printf("before: %d\n", before);

  // Espressif ESP8266 -- WiFi MCU
  Serial.println();
  Serial.printf("ESP8266 Arduino Core version %s\n", ESP.getCoreVersion().c_str());
  Serial.printf("WiFi MAC Address %s\n", WiFi.macAddress().c_str());
  Serial.printf("Free Sketch Space %d\n", ESP.getFreeSketchSpace() / 1024);

  // OTA Update
  MyOtaUpdate::setup("rfid");
  
  // ESP8266 WiFi
  WiFi.hostname("thingRfid");
  WiFi.begin(MY_SSID, MY_PASSWORD);

  Serial.println("Connecting...");
  //while (WiFi.status() != WL_CONNECTED) {
  //  delay(200);
  //  Serial.print(".");
  //}

  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.println("Connection Failed! Rebooting in 2 sec...");
    delay(2000);
    ESP.restart();
  }

  Serial.println();
  Serial.println("-----");
  WiFi.printDiag(Serial);
  Serial.println("-----");
  Serial.print("Connected, IP address: ");
  Serial.println(WiFi.localIP());

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

  Serial.printf("mDNS Hostname: %s.local\n", ArduinoOTA.getHostname().c_str()); // Ex. ping myRfid.local
  Serial.printf(" DNS Hostname: %s\n", WiFi.hostname().c_str());                // Ex. ping thingRfid


}

void loop() {

  if (irqRxCount != rxCount) {
    //Serial.printf("IrqRxCount: %d\n", irqRxCount);

    uint32_t elapsed = millis() - before;
    before = millis();

    if (elapsed < REPEAT_THRESHOLD) {
      // Serial.printf("Skip. (Same card, since less than 600 ms, got %d ms)\n", elapsed);
    } else {
      if ( mfrc522.PICC_ReadCardSerial()) {
        String json = String("{\"rfid\": [");
        Serial.print("RFID UID <");
        // mfrc522.PICC_DumpToSerial(&(mfrc522.uid));
        for (uint8_t i = 0; i < mfrc522.uid.size; i += 1) {
          Serial.printf("%02X ", mfrc522.uid.uidByte[i]);
          if (i) {
            json += String(", ");
          }
          json += String(mfrc522.uid.uidByte[i], DEC);
        }
        json += String("]}");
        Serial.printf(">. Sending UDP JSON payload `%s`\n", json.c_str());

        udp.beginPacket(BROADCAST_IP, UDP_PORT);
        udp.write(json.c_str());
        udp.endPacket();

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
  MyOtaUpdate::loop();
  delay(MAIN_LOOP_DELAY);
}

void rxHandler() {
  irqRxCount += 1;
}
