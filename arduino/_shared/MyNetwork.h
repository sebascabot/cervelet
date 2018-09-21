#ifndef MyNetwork_h
#define MyNetwork_h

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

#include <ArduinoJson.h>

WiFiUDP udp;

// IP Config

#define UDP_PORT      41234
#define BROADCAST_IP  IPAddress (255, 255, 255, 255)

// WiFi Config

// 192.168.0.x (ZyXEL EMG2926 --- Videotron)
#define MY_SSID      "VIDEOTRON6044"
#define MY_PASSWORD  "3MAMRAXAKY39M"

// 192.168.20.x (D-Link DIR-615 Router --- For Mirobot)
// #define MY_SSID      "Mirobot"
// #define MY_PASSWORD  "PapasInventeurs"

// 10.11.12.x (Raspberry Pi 3 with Raspbian Strech + hostapd/dnsmasq)
// #define MY_SSID      "Papas"
// #define MY_PASSWORD  "PradoCabot"

// x.x.x.x (ASUS RT-N66U)
// #define MY_SSID      "PapasInventeurs"
// #define MY_PASSWORD  "JamesDyson"

// x.x.x.x (TRENDnet - TEW-731BR)
// #define MY_SSID      "???"
// #define MY_PASSWORD  "??"

class MyNetwork {
    public:

    static void setup (const char *thing) {
        WiFi.hostname(thing);

        Serial.print("Connecting... ");
        WiFi.begin(MY_SSID, MY_PASSWORD);

        if (WiFi.waitForConnectResult() != WL_CONNECTED) {
            Serial.println("FAIL!");
        } else {
            Serial.println("DONE!");
        }
  
        Serial.println("----");
        WiFi.printDiag(Serial);
        Serial.println("----");
 
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("Rebooting...");
            ESP.restart();
        }
 
        Serial.printf("Hostname: %s\n", WiFi.hostname().c_str());
        Serial.printf("MAC: %s\n", WiFi.macAddress().c_str());
        Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("UDP Port: %d\n", UDP_PORT);

        udp.begin(UDP_PORT);
    }

    static void sendJson(JsonObject &json) {
        udp.beginPacket(BROADCAST_IP, UDP_PORT);
        serializeJson(json, udp);
        udp.endPacket();

        // Debug
        // serializeJson(json, Serial);
        // Serial.println();
    }
};

#endif
