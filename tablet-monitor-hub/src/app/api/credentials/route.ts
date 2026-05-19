import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // Escape credentials slightly to avoid basic shell injection
    const cleanUser = username.replace(/'/g, "");
    const cleanPass = password.replace(/'/g, "");

    await execAsync(`grdctl rdp set-credentials '${cleanUser}' '${cleanPass}'`);
    
    return NextResponse.json({ success: true, message: "Credentials updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
