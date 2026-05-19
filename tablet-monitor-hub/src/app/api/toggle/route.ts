import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === "enable") {
      // Set to extend mode
      await execAsync("gsettings set org.gnome.desktop.remote-desktop.rdp screen-share-mode 'extend'");
      await execAsync("grdctl rdp disable-view-only");
      await execAsync("grdctl rdp enable");
      // Ensure the service is actually running
      await execAsync("systemctl --user start gnome-remote-desktop.service");
      return NextResponse.json({ success: true, message: "Enabled Virtual Monitor" });
    } else if (action === "disable") {
      await execAsync("grdctl rdp disable");
      await execAsync("systemctl --user stop gnome-remote-desktop.service");
      return NextResponse.json({ success: true, message: "Disabled Virtual Monitor" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
