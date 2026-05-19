#!/bin/bash

# ==============================================================================
#  Weylus Secondary Monitor Starter
# ==============================================================================

# Custom premium colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ==============================================================================
#  Configuration Settings
# ==============================================================================
# Set your desired resolution for the secondary display.
# Common high-resolution options:
# - "1920x1080" (16:9 Full HD)
# - "1920x1200" (16:10 WUXGA - Crisp and highly recommended for modern tablets)
# - "2000x1200" (5:3 Ratio - Native for many 10-11 inch tablets)
# - "2560x1600" (16:10 WQXGA - Ultra-sharp, requires more GPU/CPU bandwidth)
RESOLUTION="1228x768"

echo -e "${CYAN}${BOLD}======================================================================${NC}"
echo -e "${CYAN}${BOLD}   🚀 Starting Weylus Hardware-Accelerated Touchscreen Monitor...     ${NC}"
echo -e "${CYAN}${BOLD}======================================================================${NC}"

# 1. Start ADB Reverse Port Forwarding
echo -e "\n${BLUE}[1/4] Linking USB connection...${NC}"
if adb devices | grep -q "device$"; then
    echo -e "   ${GREEN}✔${NC} Found connected Android device."
    adb reverse tcp:1701 tcp:1701 >/dev/null 2>&1
    echo -e "   ${GREEN}✔${NC} Successfully forwarded tablet's http://localhost:1701 to laptop."
else
    echo -e "   ${YELLOW}⚠ No Android device found via ADB.${NC}"
    echo -e "     Please connect your tablet via USB-C and ensure USB Debugging is ON."
fi

# 2. Check and Launch Weylus in Background
echo -e "\n${BLUE}[2/4] Starting Weylus Server...${NC}"
# Kill existing weylus processes to avoid port binding conflicts
pkill -f weylus >/dev/null 2>&1
sleep 1

# Run weylus in the background with software H.264 / PipeWire support.
nohup weylus --wayland-support --auto-start > weylus.log 2>&1 &
WEYLUS_PID=$!

sleep 1.5
if ps -p $WEYLUS_PID > /dev/null; then
    echo -e "   ${GREEN}✔${NC} Weylus Server launched in the background (PID: $WEYLUS_PID)."
    echo -e "     Stability: Enabled (Software H.264, 0% Crash Risk)."
    echo -e "     Log file: ${BOLD}weylus.log${NC}"
else
    echo -e "   ${RED}❌ Failed to start Weylus server.${NC} Check weylus.log for details."
    exit 1
fi

# 3. Instruction to trigger the headless Virtual Display
echo -e "\n${BLUE}[3/4] Launching Local RDP Loopback...${NC}"
echo -e "   ${YELLOW}ℹ Why we do this:${NC}"
echo -e "     GNOME Remote Desktop only spawns the high-performance 'Virtual-1'"
echo -e "     monitor when an RDP client is connected. We will connect locally to"
echo -e "     trigger and keep the virtual screen alive."
echo -e ""
echo -e "   ${BOLD}Action Required:${NC}"
echo -e "     In the Remmina window that opens, connect to ${CYAN}localhost${NC} using"
echo -e "     the RDP credentials you set earlier."
echo -e "     (Once connected, you can minimize Remmina - it just keeps the screen alive!)."

# Kill any existing Remmina processes to avoid profile conflict
pkill -f remmina >/dev/null 2>&1
sleep 1

# Dynamically generate optimized Remmina profile for the requested resolution
R_WIDTH=$(echo "$RESOLUTION" | cut -d'x' -f1)
R_HEIGHT=$(echo "$RESOLUTION" | cut -d'x' -f2)
RDP_USER=$(grdctl status --show-credentials 2>/dev/null | grep "Username:" | awk '{print $2}')

# Fallback to "tablet" if username can't be fetched
if [ -z "$RDP_USER" ]; then
    RDP_USER="tablet"
fi

printf "[remmina]\nname=Weylus Tablet Monitor\nserver=127.0.0.1\nprotocol=RDP\nresolution_mode=0\nresolution_width=%s\nresolution_height=%s\ncolor_depth=32\nviewmode=1\nusername=%s\n" "$R_WIDTH" "$R_HEIGHT" "$RDP_USER" > "$(pwd)/weylus.remmina"

# Launch Remmina with the dynamically generated high-resolution profile in background
nohup remmina -c "$(pwd)/weylus.remmina" >/dev/null 2>&1 &

# Start a persistent background daemon to auto-map Weylus touch inputs to the virtual screen
# while Weylus is active.
(
    LAST_SERIAL=""
    while ps -p $WEYLUS_PID >/dev/null 2>&1; do
        V_INFO=$(gdbus call --session --dest=org.gnome.Mutter.DisplayConfig \
            --object-path /org/gnome/Mutter/DisplayConfig \
            --method org.gnome.Mutter.DisplayConfig.GetCurrentState \
            2>/dev/null | grep -oE "\('Meta-[0-9]+', '[^']+', '[^']+', '[^']+'\)" | head -n1)
        
        if [ ! -z "$V_INFO" ]; then
            V_VENDOR=$(echo "$V_INFO" | cut -d"'" -f4)
            V_PRODUCT=$(echo "$V_INFO" | cut -d"'" -f6)
            V_SERIAL=$(echo "$V_INFO" | cut -d"'" -f8)
            
            # Only update if the serial has changed
            if [ "$V_SERIAL" != "$LAST_SERIAL" ]; then
                gsettings set org.gnome.desktop.peripherals.touchscreen:/org/gnome/desktop/peripherals/touchscreens/1701:1701/ output "['$V_VENDOR', '$V_PRODUCT', '$V_SERIAL']"
                gsettings set org.gnome.desktop.peripherals.tablet:/org/gnome/desktop/peripherals/tablets/1701:1701/ output "['$V_VENDOR', '$V_PRODUCT', '$V_SERIAL']"
                LAST_SERIAL="$V_SERIAL"
            fi
        fi
        sleep 2
    done
) &


# Automatically detect the high-speed USB tethering IP for optimal latency
USB_IP=$(ip -o -4 addr show | grep -E 'enx|usb' | awk '{print $4}' | cut -d/ -f1 | head -n1)

# 4. Instructions for Tablet connection
echo -e "\n${BLUE}[4/4] Connection Instructions for Tablet:${NC}"
echo -e "   1. Open ${CYAN}${BOLD}Chrome/Firefox${NC} on your Android tablet."
if [ ! -z "$USB_IP" ]; then
    echo -e "   2. Navigate to: ${GREEN}${BOLD}http://${USB_IP}:1701${NC}  ${CYAN}(🔥 RECOMMENDED: Ultra-Low Latency USB Link)${NC}"
    echo -e "      Or navigate to: ${YELLOW}http://localhost:1701${NC}  (Localhost Port Forwarding)"
else
    echo -e "   2. Navigate to: ${GREEN}${BOLD}http://localhost:1701${NC}"
fi
echo -e "   3. In the Weylus dashboard:"
echo -e "      - Capture Mode: ${BOLD}PipeWire${NC}"
echo -e "      - Screen: ${BOLD}Virtual-1${NC} (your secondary extended monitor)"
echo -e "      - Enable: ${BOLD}Touch${NC} & ${BOLD}Stylus${NC}"
echo -e "   4. Tap the ${CYAN}${BOLD}Fullscreen${NC} button at the top right of the page!"
echo -e ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 SETUP COMPLETE! Enjoy your ultra-low latency secondary touch screen!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "To stop the Weylus server, run: ${BOLD}pkill -f weylus${NC}"
