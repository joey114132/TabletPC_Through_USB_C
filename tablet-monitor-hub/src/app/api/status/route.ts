import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Check grdctl status
    const { stdout: statusOut } = await execAsync("grdctl status");
    const isEnabled = statusOut.includes("Status: enabled");
    
    // Check USB tethering IP
    const { stdout: ipOut } = await execAsync("ip -br a");
    const lines = ipOut.split("\n");
    let usbIp = "";
    
    for (const line of lines) {
      if ((line.includes("usb") || line.includes("enx") || line.includes("enp")) && (line.includes("UP") || line.includes("UNKNOWN"))) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const ipWithSubnet = parts[2];
          if (ipWithSubnet.includes(".")) {
            usbIp = ipWithSubnet.split("/")[0];
            break;
          }
        }
      }
    }
    
    // If we can't reliably detect usb, fallback to the 10.148.x.x one if it exists
    if (!usbIp) {
        for (const line of lines) {
            if (line.includes("10.148.") || line.includes("192.168.42.")) {
                 const parts = line.trim().split(/\s+/);
                 if (parts.length >= 3 && parts[2].includes(".")) {
                    usbIp = parts[2].split("/")[0];
                    break;
                 }
            }
        }
    }

    return NextResponse.json({
      enabled: isEnabled,
      ip: usbIp || "Not Connected",
      statusText: statusOut
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
