import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  const colors = {
    success: { border: "rgba(46,204,113,.3)",  color: "#2ECC71" },
    error:   { border: "rgba(255,71,87,.3)",   color: "#FF4757" },
    info:    { border: "rgba(0,229,255,.3)",   color: "#00E5FF" },
  };
  const c = colors[type] ?? colors.info;

  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:999,
      background:"#080812", border:`1px solid ${c.border}`,
      borderRadius:10, padding:"12px 18px",
      fontFamily:"var(--font-mono)", fontSize:".78rem", color: c.color,
      display:"flex", alignItems:"center", gap:10,
      boxShadow:"0 8px 32px rgba(0,0,0,.5)",
      animation:"fadeUp .3s ease",
    }}>
      {message}
    </div>
  );
}
