#!/bin/bash

echo "=========================================="
echo " Setting up Android Tablet as Monitor..."
echo "=========================================="

# Ensure the config directory exists
mkdir -p ~/.config/gnome-remote-desktop

# Generate self-signed certificate if it doesn't exist
if [ ! -f ~/.config/gnome-remote-desktop/rdp-cert.pem ]; then
    echo "[*] Generating TLS Certificate for RDP Server..."
    openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
        -keyout ~/.config/gnome-remote-desktop/rdp-key.pem \
        -out ~/.config/gnome-remote-desktop/rdp-cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=gnome-remote-desktop" > /dev/null 2>&1
fi

# Set the certificate in GNOME Remote Desktop
echo "[*] Configuring GNOME Remote Desktop..."
grdctl rdp set-tls-key ~/.config/gnome-remote-desktop/rdp-key.pem > /dev/null 2>&1
grdctl rdp set-tls-cert ~/.config/gnome-remote-desktop/rdp-cert.pem > /dev/null 2>&1

# Set the RDP mode to EXTEND instead of Mirror
echo "[*] Setting screen share mode to EXTEND (Virtual Monitor)..."
gsettings set org.gnome.desktop.remote-desktop.rdp screen-share-mode 'extend'

# Disable view-only so you can use the tablet's touch screen
echo "[*] Enabling Touch/Mouse control..."
grdctl rdp disable-view-only > /dev/null 2>&1

# Ask the user for credentials to secure the connection
echo ""
echo "Let's set a Username and Password for the Tablet to connect to."
read -p "Username: " RDP_USER
read -s -p "Password: " RDP_PASS
echo ""

grdctl rdp set-credentials "$RDP_USER" "$RDP_PASS" > /dev/null 2>&1

# Enable the server
echo "[*] Starting the RDP Server..."
grdctl rdp enable > /dev/null 2>&1

echo ""
echo "=========================================="
echo " SUCCESS! The server is running."
echo "=========================================="
echo "Next Steps:"
echo "1. Connect your Android tablet via USB-C."
echo "2. On your tablet, go to Settings > Network > Hotspot/Tethering and enable 'USB Tethering'."
echo "3. Run 'ip -br a' in this terminal to find the IP address of your new USB network interface (often named usb0 or enp...)."
echo "4. On your tablet, open a Remote Desktop App (like Microsoft Remote Desktop) and connect to that IP address."
echo "5. Log in with the Username and Password you just set."
echo "=========================================="
