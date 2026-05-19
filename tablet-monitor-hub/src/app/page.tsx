"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MonitorPlay, MonitorOff, KeyRound, QrCode, Laptop, Server, Save } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  const [status, setStatus] = useState<{ enabled: boolean; ip: string; statusText: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleMonitor = async () => {
    if (!status) return;
    setLoading(true);
    await fetch("/api/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: status.enabled ? "disable" : "enable" }),
    });
    await fetchStatus();
  };

  const updateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setSaving(false);
    setPassword("");
  };

  if (loading && !status) {
    return <div className={styles.container}><div className={styles.header}>INITIALIZING SYSTEM...</div></div>;
  }

  // Use the browser's hostname to generate the QR code URL.
  // If the USB IP is available, that is the most reliable one to give to the tablet.
  const tabletUrl = typeof window !== "undefined" && status?.ip && status.ip !== "Not Connected" 
    ? `http://${status.ip}:3000/tablet?ip=${status.ip}`
    : typeof window !== "undefined" ? `${window.location.origin}/tablet` : "";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tablet Monitor Hub</h1>
        <p className={styles.subtitle}>Gnome Remote Desktop / Wayland Headless Extend</p>
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Server size={24} color="var(--accent-cyan)" />
          System Status
          <div className={`${styles.statusIndicator} ${status?.enabled ? styles.active : ""}`} />
        </h2>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>USB Tethering IP</label>
          <div className={styles.monoText}>{status?.ip || "DISCONNECTED"}</div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Virtual Monitor State</label>
          <div className={styles.monoText}>{status?.enabled ? "ACTIVE (EXTEND MODE)" : "OFFLINE"}</div>
        </div>

        <button 
          onClick={toggleMonitor}
          className={`${styles.button} ${status?.enabled ? styles.magenta : ""}`}
        >
          {status?.enabled ? <><MonitorOff size={18} /> Disable Display</> : <><MonitorPlay size={18} /> Enable Display</>}
        </button>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <QrCode size={24} color="var(--accent-magenta)" />
          Tablet Portal
        </h2>
        <div className={styles.qrContainer}>
          {tabletUrl && status?.ip && status.ip !== "Not Connected" ? (
            <>
              <div className={styles.qrCode}>
                <QRCodeSVG value={tabletUrl} size={180} level="H" />
              </div>
              <p className={styles.qrText}>
                Scan with your tablet to instantly connect and download configuration
              </p>
            </>
          ) : (
            <div className={styles.qrText} style={{ color: "var(--accent-magenta)" }}>
              Awaiting USB Connection...
            </div>
          )}
        </div>
      </div>

      <div className={styles.card} style={{ gridColumn: "1 / -1", maxWidth: "600px", justifySelf: "center", width: "100%" }}>
        <h2 className={styles.cardTitle}>
          <KeyRound size={24} color="var(--text-main)" />
          Connection Credentials
        </h2>
        <form onSubmit={updateCredentials}>
          <div className={styles.formGroup}>
            <label className={styles.label}>RDP Username</label>
            <input 
              type="text" 
              className={styles.input} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. tablet"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>RDP Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep unchanged"
              required
            />
          </div>
          <button type="submit" className={styles.button} disabled={saving} style={{ width: "100%" }}>
            <Save size={18} /> {saving ? "UPDATING..." : "UPDATE CREDENTIALS"}
          </button>
        </form>
      </div>
    </div>
  );
}
