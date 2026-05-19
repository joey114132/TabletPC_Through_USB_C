import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ip = searchParams.get("ip");
  const user = searchParams.get("user") || "jwlee8403";

  if (!ip) {
    return new NextResponse("Missing IP parameter", { status: 400 });
  }

  // Create RDP file contents
  // We use standard parameters to optimize for remote desktop on mobile devices
  const rdpContent = `
full address:s:${ip}:3389
username:s:${user}
prompt for credentials:i:1
administrative session:i:0
audiomode:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
`;

  const headers = new Headers();
  headers.set("Content-Type", "application/x-rdp");
  headers.set("Content-Disposition", `attachment; filename="tablet-monitor.rdp"`);

  return new NextResponse(rdpContent.trim(), {
    status: 200,
    headers,
  });
}
