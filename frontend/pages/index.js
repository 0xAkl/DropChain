import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.wrap}>
      <div className={styles.eyebrow}>Powered by Shelby Protocol × Aptos</div>
      <h1 className={styles.title}>
        Share Files.<br /><span className={styles.gradient}>No Servers.</span>
      </h1>
      <p className={styles.sub}>
        End-to-end encrypted, on-chain access control, temporary by design.
        Files live on decentralised storage and expire the moment you want them to.
      </p>
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={() => router.push("/app")}>
          Upload a File →
        </button>
        <button className={styles.btnGhost} onClick={() => router.push("/retrieve")}>
          Retrieve File
        </button>
      </div>

      <div className={styles.stats}>
        {[
          { val:"2,841", label:"Files Shared" },
          { val:"18.4 GB", label:"Data Stored" },
          { val:"47", label:"Active Nodes" },
        ].map(s => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statVal}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.features}>
        {[
          { icon:"🔐", title:"AES-256 Encryption", desc:"Client-side encryption before upload. The key never leaves your device." },
          { icon:"⛓️", title:"On-Chain Access Control", desc:"Aptos Move module tracks registry, view counts, and expiry — tamper-proof." },
          { icon:"💨", title:"Auto-Expiry", desc:"Set a TTL or max view count. When it hits, access is revoked on-chain." },
        ].map(f => (
          <div key={f.title} className={styles.featureCard}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <div className={styles.featureTitle}>{f.title}</div>
            <div className={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
