#!/usr/bin/env bash

# Parameters

IF="wlan0"
SSID="Papas"
PASSWORD="PradoCabot"
ADDRESS="10.11.12.0"
NETMASK="24" # 24 <=> 254 Host

# if [ "$EUID" -ne 0 ]
# then
#     echo "Must be root"
#     exit
# fi

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
# Config `dhcpcd`
SERVICE="dhcpcd"
CONF="/etc/${SERVICE}.conf"
while read LINE; do
  if ! grep -q "^${LINE}" ${CONF}
  then
    echo "$LINE" >> ${CONF}
  fi
done <<EOF                                                                                                              
nohook wpa_supplicant
interface ${IF}
static ip_address=${IP_HOST}/${NETMASK}
static routers=${IP_HOST}
EOF
# Extra line to get DNS to work
# static domain_name_servers=8.8.8.8
sudo systemctl restart ${SERVICE}
sudo systemctl status ${SERVICE}

# ------------------------------------------------------------------------------
# Config `dnsmasq`
SERVICE="dnsmasq"
CONF="/etc/${SERVICE}.conf"
if ! which ${SERVICE} >> /dev/null
then
  sudo apt install ${SERVICE} -yqq
fi
sudo tee ${CONF} >/dev/null <<EOF
interface=${IF}
domain-needed
bogus-priv
dhcp-range=${IP_DHCP_MIN},${IP_DHCP_MAX},${IP_NETMASK},12h
EOF
cat ${CONF} # Debug
sudo systemctl restart ${SERVICE}
sudo systemctl status ${SERVICE}

# ------------------------------------------------------------------------------
# Config `hostapd`
SERVICE="hostapd"
CONF="/etc/${SERVICE}/${SERVICE}.conf"

if ! which ${SERVICE} >> /dev/null
then
  sudo apt install ${SERVICE}
fi
sudo tee ${CONF} >/dev/null <<EOF
interface=${IF}
ssid=${SSID}
wpa_passphrase=${PASSWORD}
driver=nl80211
hw_mode=g
channel=6
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF
sudo sed -i -- 's/#DAEMON_CONF=""/DAEMON_CONF="\/etc\/hostapd\/hostapd.conf"/g' /etc/default/hostapd
sudo systemctl restart ${SERVICE}
sudo systemctl status ${SERVICE}
ps uxa|grep "${SERVICE}"
# sudo service ${SERVIE} restart

# ------------------------------------------------------------------------------
# Status
echo
echo "------"
echo "Status"
echo "------"
iwconfig ${IF}
# wpa_cli -i ${IF} status # Should report an error if OK
