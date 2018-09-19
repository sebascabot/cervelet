# Project description

Things are connected to a central point (cervelet) which dictate to others things how to react.

# Architecture

- WiFi Network (without internet)
- Each this send payload via UDP
- The `cervelet` is a NodeJs app running on a SBC wich receive all UDP payload send by things and send back request to the `things`.

# The `cervelet`

It's a UDP server in NodeJS. The file is name `server.js`, so we can use `npm start` to lauch it.

# Things

- RFID Card reader (ESP8266)
- Cervelet (Raspberry PI running a NodeJs UDP server)
- eqbe (ESP8266)

# Requirement

- OTA Update must be available, so we must config mDNS (on things and build
  machine with a `zeroconf` implementation.

# Usefull Commands

To explore things on the network (find their IP address)

    nmap -sn 10.11.12.0/24

To explore things on the network (find their MAC address)

    arp

# Zeroconf with Avahi implementation

On linux the `zeroconf` implementation used is the GNU `avahi`

On MAC OS X the `zeroconf` implementation used is Apple `Bonjour`

Zeroconf is:

1. Name resolution (with mDNS), will use .local TLD
2. Service Advertising
3. Address allocation (use ARP strategy)

Usually DHCP and DNS does this, but it's centrilised, while `zeroconf` provide a decentralized solution.

Zeroconf Name resolution (with the .local) use UDP Multicast on port 5353 ip 224.0.0.251.
It's important no firewall block this to allow it to work.
Notice the parallele with DNS using port 53.

# Links

https://www.1and1.ca/digitalguide/server/know-how/bonjour-software-for-zero-configuration-networking/
