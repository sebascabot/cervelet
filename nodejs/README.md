SBC Configuration (A Raspberry PI 3).

Use latest Raspbien full image


# Complete Raspian Configuration

Use the GUI or the CLI `sudo raspi-config`

Select Country, Language, WiFi Settings, etc.

For the Keyboard, use the follwing

- Model: 'Generic 105-key (Intl) PC
- Layout: 'English (US)'
- Variant 'English (international AltGr dead keys)'

Then, enabled `ssh`. It may became very usefull in the futur.

# Setup/Install common Linux tools
Install tools:
- vim (copy ~/.vimrc, set bkp dir, disabled pathogen)
- tmux (copy my config file)
- git (set my identity)
- config ssh (keys, auth, etc.)
- nvm (`curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash`)
- nodejs (`nvm install v10.10.0`)
- feh


# NodeJS Server Application:

Lauch the server

   > cd ~/cervelet/nodejs
   > npm start

Or alternatively, directly run the server like this

   > ./server.js

# Access Point (HotSpot) Setup

We need to install and configure `hostapd`, `dnsmasq` and alter `dhcpcd5` configuration.

Since network setup has changed in Raspbian 9 Stretch, more attention is needed to make it operate properly.

The bash script `./tools/setup-access-point.sh` the process of this tedious and error prone task.

# Info

Screen Resolution: 1920x1080

To scan WiFi Network on Linux, `sudo iw dev wlo1 scan|grep SSID`, then to see more info about it `nmcli dev wifi list`.

# Requirement
#
Install PulseAudio#

     > sudo apt install pulseaudio
