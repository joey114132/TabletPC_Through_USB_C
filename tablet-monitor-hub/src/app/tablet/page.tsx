"use client";

import { useSearchParams } from "next/navigation";
import { Download, MonitorSmartphone } from "lucide-react";
import styles from "./page.module.css";
import { Suspense } from "react";

function TabletPortalContent() {
  const searchParams = useSearchParams();
  const ip = searchParams.get("ip");

  const handleConnect = () => {
    if (!ip) {
      alert("IP Address not provided in URL.");
      return;
    }
    // Trigger download
    window.location.href = `/api/download-rdp?ip=${ip}`;
  };

  return (
    <div className={styles.container}>
      <MonitorSmartphone size={64} color="var(--accent-cyan)" style={{ marginBottom: "2rem" }} />
      <h1 className={styles.title}>Tablet Monitor Portal</h1>
      <p className={styles.subtitle}>Transform this device into a secondary display</p>

      <button className={styles.button} onClick={handleConnect}>
        <Download size={24} />
        CONNECT NOW
      </button>

      <div className={styles.info}>
        Make sure you have Microsoft Remote Desktop installed on this device.<br/><br/>
        Target IP: {ip || "Unknown"}
      </div>
    </div>
  );
}

export default function TabletPortal() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading...</div>}>
      <TabletPortalContent />
    </Suspense>
  );
}
