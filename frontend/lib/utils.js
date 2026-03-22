export const delay = ms => new Promise(r => setTimeout(r, ms));

export function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} MB`;
  return `${(b / 1_073_741_824).toFixed(2)} GB`;
}

export function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function relTime(ts, past = false) {
  const d = Math.abs(Date.now() - ts);
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ${past ? "ago" : "left"}`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${past ? "ago" : "left"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${past ? "ago" : "left"}`;
  return `${Math.floor(h / 24)}d ${past ? "ago" : "left"}`;
}

export function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  const map = {
    pdf: "📄", jpg: "🖼", jpeg: "🖼", png: "🖼", gif: "🖼", webp: "🖼",
    mp4: "🎬", mov: "🎬", mp3: "🎵", wav: "🎵",
    zip: "🗜", rar: "🗜", "7z": "🗜",
    doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
    js: "💻", ts: "💻", py: "🐍", json: "📋", csv: "📊",
  };
  return map[ext] ?? "📂";
}

export function extClass(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "img";
  if (["zip","rar","7z"].includes(ext)) return "zip";
  return "";
}

export function fileStatus(file) {
  const now = Date.now();
  if (file.status === "revoked") return "revoked";
  if (file.expiry && file.expiry < now) return "expired";
  if (file.expiry && (file.expiry - now) < 3_600_000) return "expiring";
  return "active";
}

export function shortAddr(addr = "") {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
