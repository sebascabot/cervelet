#!/usr/bin/env bash

# Parameters

IF="wlan0"
SSID="Papas"
PASSWORD="PradoCabot"
ADDRESS="10.11.12.0"
NETMASK="24" # 24 <=> 254 Host

# Need `ipcalc` to extrac Network IP information
if ! which ipcalc >> /dev/null
then
  sudo apt install ipcalc
fi

IP_HOST=$(ipcalc $ADDRESS|awk '/HostMin/{print $2}')
echo "IP HOST: ${IP_HOST}"   # Ex. 10.11.12.1

HEAD=$(echo "${IP_HOST}" | cut -d '.' -f 1-3)
TAIL=$(echo "${IP_HOST}" | cut -d '.' -f 4)
IP_DHCP_MIN="${HEAD}.$((${TAIL} + 1))"
echo "IP DHCP MIN: $IP_DHCP_MIN"   # Ex. 10.11.12.2

IP_DHCP_MAX=$(ipcalc $ADDRESS/$NETMASK|awk '/HostMax/{print $2}')
echo "IP DHCP MAX: $IP_DHCP_MAX"   # Ex. 10.11.12.254

IP_NETMASK=$(ipcalc $ADDRESS/$NETMASK|awk '/Netmask/{print $2}')
echo "IP Netmask: $IP_NETMASK"   # Ex. 255.255.255.0

# ... Long command
# sudo apt update
# sudo apt upgrade

# Workaround for bug in `dnsmasq` prior versions 2.77
# sudo apt purge dns-root-data -yqq
# dpkg -s dnsmasq|awk '/^Version: /{print $2}' # To check install version

# ------------------------------------------------------------------------------
# Config `hostapd`
SERVICE="hostapd"
CONF="/etc/${SERVICE}/${SERVICE}.conf"

sudo rm "${CONF}"
if which ${SERVICE} >> /dev/null
then
  sudo apt remove --purge ${SERVICE} libnl-route-3-200 -y
fi
ps uxa|grep "${SERVICE}"

# ------------------------------------------------------------------------------
# Config `dnsmasq`
SERVICE="dnsmasq"
CONF="/etc/${SERVICE}.conf"
if which ${SERVICE} >> /dev/null
then
  sudo apt remove --purge ${SERVICE} dns-root-data dnsmasq-base -y
fi
sudo rm ${CONF}
ps uxa|grep "${SERVICE}"

# ------------------------------------------------------------------------------
# Config `dhcpcd`
SERVICE="dhcpcd"
CONF="/etc/${SERVICE}.conf"
while read LINE; do
  # sudo sed -i -- "s#${LINE}\r##g" ${CONF}
  ESC_LINE=$(echo ${LINE} | sed 's#/#\\/#g')
  sudo sed -i -- "/${ESC_LINE}/d" ${CONF}
done <<EOF                                                                                                              
nohook wpa_supplicant
interface ${IF}
static ip_address=${IP_HOST}/${NETMASK}
static routers=${IP_HOST}
EOF

# ------------------------------------------------------------------------------
# Attempt to Bring back wlan0 (in order to get /var/run/wpa_supplicant back)
# BUMMER! Not working, must reboot
sudo ip addr flush dev wlan0 # Remove static IP
sudo ifconfig wlan0 up # Bring it back to life ???

sudo systemctl restart ${SERVICE}
sudo systemctl status ${SERVICE}

# ------------------------------------------------------------------------------
# Status
echo
echo "------"
echo "Status"
echo "------"
iwconfig ${IF}
wpa_cli -i ${IF} status # Should not report an error
