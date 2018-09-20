#ifndef MyNetworkSetup_h
#define MyNetworkSetup_h

#include <WiFiUdp.h>

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

#endif
