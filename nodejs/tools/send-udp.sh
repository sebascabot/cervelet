#!/usr/bin/env bash

HOST="255.255.255.255"
PORT="41234"

JSON='{"rgb":[10,0,0]}'
JSON='{"from":"owl","to":"hub","button":1}'
JSON='{"from":"hub","to":"owl","red": 1023,"green":0,"blue":0}'
JSON='{"from":"hub","to":"owl","red": 0,"green":0,"blue":1023}'
JSON='{"from":"rfid","to":"hub","rfid":"A5:11:F8:43"}' # RED Tag

echo -n "$JSON" | socat - UDP-DATAGRAM:255.255.255.255:41234,broadcast

# Nice Bash feature is a clever `/dev/upd` device,
# but there's a flaw, it does not allow to broadcast.
# HOST="cervelet.local"
# echo -n "$JSON" >/dev/udp/${HOST}/${PORT}

