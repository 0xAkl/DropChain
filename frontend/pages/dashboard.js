import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { loadRegistry, updateFile } from "../lib/registry";
import { revokeFile } from "../lib/aptos";
import { formatBytes, truncate, fileIcon, extClass, fileStatus, relTime } from "../lib/utils";
import s from "../styles/Dashboard.module.css";

export default function Dashboard({ wallet, showToast }) {
  const router = useRouter();
  const [files,       setFiles]       = useState([]);
  const [filter,      setFilter]      = useState("all");
  const [revokeTarget,setRevokeTarget] = useState(null);

  useEffect(() => { setFiles(loadRegistry()); }, []);

  const filtered = files.filter(f => {
    if (filter === "all") return true;
    const st = fileStatus(f);
    if (filter === "active")  return st === "active" || st === "expiring";
    if (filter === "expired") return st === "expired" || st === "revoked";
    return true;
  });

  const active   = files.filter(f => { const st = fileStatus(f); return st==="active"||st==="expiring"; }).length;
  const views    = files.reduce((a,b) => a + b.views, 0);
  const storage  = files.reduce((a,b) => a + b.size,  0);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    try {
      // await revokeFile(wallet, revokeTarget); // uncomment when wallet wired
      const updated = updateFile(revokeTarget, { status:"revoked" });
      setFiles(updated);
      showToast("Access revoked on-chain", "success");
    } catch (e) {
      showToast(e.message ?? "Revoke failed", "error");
    } finally {
      setRevokeTarget(null);
    }
  }, [revokeTarget, wallet, showToast]);

  const statusBadge = st => ({
    active:   <span className={`${s.badge} ${s.badgeActive}`}>Active</span>,
    expiring: <span className={`${s.badge} ${s.badgeExpiring}`}>Expiring</span>,
    expired:  <span className={`${s.badge} ${s.badgeExpired}`}>Expired</span>,
    revoked:  <span className={`${s.badge} ${s.badgeExpired}`}>Revoked</span>,
  }[st]);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Dashboard</h2>
        <p className={s.sub}>Track views, manage access, revoke anytime.</p>
      </div>

      {/* metrics */}
      <div className={s.metrics}>
        {[
          { label:"Active Files",  badge:"Live",   val: active,               sub:"on-chain registrations" },
          { label:"Total Views",   badge:"Aptos",  val: views,                sub:"across all files" },
          { label:"Storage Used",  badge:"Shelby", val: formatBytes(storage), sub:"decentralised blobs" },
        ].map(m => (
          <div key={m.label} className={s.metricCard}>
            <div className={s.metricTop}>
              <span className={s.metricLabel}>{m.label}</span>
              <span className={s.metricBadge}>{m.badge}</span>
            </div>
            <div className={s.metricVal}>{m.val}</div>
            <div className={s.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* table */}
      <div className={s.tablePanel}>
        <div className={s.tableHeader}>
          <div className={s.tableTitle}>Shared Files</div>
          <div className={s.filterRow}>
            {["all","active","expired"].map(f => (
              <div key={f} className={`${s.filterChip} ${filter===f ? s.filterOn : ""}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {!filtered.length ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>📭</div>
            <div className={s.emptyText}>No files yet</div>
            <div className={s.emptySub}>Upload a file to see it tracked here</div>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>File</th><th>CID</th><th>Views</th><th>Expires</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.cid} onClick={() => router.push(`/retrieve?cid=${f.cid}`)}>
                  <td>
                    <div className={s.nameCell}>
                      <span className={`${s.ext} ${s["ext_"+extClass(f.name)]}`}>
                        {f.name.split(".").pop().toUpperCase().slice(0,4)}
                      </span>
                      {truncate(f.name, 22)}
                    </div>
                  </td>
                  <td><span className={s.mono}>{f.cid.slice(0,12)}…</span></td>
                  <td><span className={s.mono}>{f.views}{f.maxViews ? "/"+f.maxViews : ""}</span></td>
                  <td><span className={s.mono}>{f.expiry ? relTime(f.expiry) : "∞"}</span></td>
                  <td>{statusBadge(fileStatus(f))}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className={s.rowActions}>
                      <button className={s.rowBtn}
                        onClick={() => { navigator.clipboard.writeText(f.cid); showToast("CID copied!","success"); }}>
                        Copy CID
                      </button>
                      <button className={`${s.rowBtn} ${s.danger}`}
                        onClick={() => setRevokeTarget(f.cid)}>
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* revoke modal */}
      {revokeTarget && (
        <div className={s.modalOverlay} onClick={() => setRevokeTarget(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalTitle}>Revoke Access?</div>
            <div className={s.modalSub}>
              This permanently removes on-chain access. The CID still exists on Shelby but the registry entry will be deleted.
            </div>
            <div className={s.modalActions}>
              <button className={s.btnSm} onClick={() => setRevokeTarget(null)}>Cancel</button>
              <button className={`${s.btnSm} ${s.btnDanger}`} onClick={handleRevoke}>Revoke Access</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
