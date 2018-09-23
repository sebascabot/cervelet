#!/usr/bin/env bash

# Port 6600

echo 'stop' | socat STDIN TCP4:localhost:6600  # Example 1
echo 'play' | netcat -N localhost 6600         # Example 2
