import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { downloadByCid } from "../lib/shelby";
import { decryptFile, downloadDataUrl } from "../lib/encryption";
import { incrementViews } from "../lib/aptos";
import { getFile, updateFile, isAccessible } from "../lib/registry";
import { formatBytes, relTime, fileIcon } from "../lib/utils";
import s from "../styles/Retrieve.module.css";

export default function RetrievePage({ wallet, showToast }) {
  const router        = useRouter();
  const [cid,       setCid]       = useState("");
  const [meta,      setMeta]      = useState(null);
  const [error,     setError]     = useState("");
  const [password,  setPassword]  = useState("");
  const [fetching,  setFetching]  = useState(false);
  const [decrypting,setDecrypting]= useState(false);

  // pre-fill CID from query param
  useEffect(() => {
    if (router.query.cid) {
      setCid(router.query.cid);
    }
  }, [router.query.cid]);

  // auto-fetch when CID arrives via query
  useEffect(() => {
    if (router.query.cid) fetchFile(router.query.cid);
  }, [router.query.cid]);

  const fetchFile = async (cidOverride) => {
    const target = cidOverride ?? cid.trim();
    if (!target) { showToast("Enter a CID", "error"); return; }

    setFetching(true);
    setError("");
    setMeta(null);

    try {
      // Check local registry first; in production also query Aptos chain
      const record = getFile(target);

      if (!record) {
        // Simulate an externally-shared file (production: fetch from Aptos)
        setMeta({
          name: "shared-document.pdf",
          size: 4_218_880,
          cid: target,
          uploaded: Date.now() - 86_400_000,
          expiry:   Date.now() + 3_600_000,
          views: 3, maxViews: 10, status: "active",
        });
        return;
      }

      const { ok, reason } = isAccessible(record);
      if (!ok) { setError(reason); return; }

      // increment view count
      const updated = updateFile(target, { views: record.views + 1 });
      const fresh   = updated.find(f => f.cid === target);
      setMeta(fresh);
      // await incrementViews(wallet, target); // uncomment when wallet wired
    } catch (e) {
      setError(e.message ?? "Failed to fetch file info");
    } finally {
      setFetching(false);
    }
  };

  const decryptAndDownload = async () => {
    if (!password) { showToast("Enter the decryption password", "error"); return; }
    setDecrypting(true);
    try {
      // In production:
      // const cipher   = await downloadByCid(meta.cid);
      // const dataUrl  = decryptFile(cipher, password);
      // downloadDataUrl(dataUrl, meta.name);

      // Dev stub — simulate decryption delay
      await new Promise(r => setTimeout(r, 1000));
      showToast("In live mode: decrypted file would download here", "info");
    } catch (e) {
      showToast(e.message ?? "Decryption failed — wrong password?", "error");
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Retrieve File</h2>
        <p className={s.sub}>Enter a CID and your decryption password to download.</p>
      </div>

      <div className={s.wrap}>
        {/* CID input */}
        <div className={s.cidRow}>
          <input
            className={s.cidInput}
            value={cid}
            onChange={e => { setCid(e.target.value); setMeta(null); setError(""); }}
            placeholder="Enter CID — e.g. bafybeig…"
            onKeyDown={e => e.key === "Enter" && fetchFile()}
          />
          <button className={s.fetchBtn} onClick={() => fetchFile()} disabled={fetching}>
            {fetching ? "…" : "Fetch →"}
          </button>
        </div>

        {/* error */}
        {error && (
          <div className={s.errorBanner}>⚠️ {error}</div>
        )}

        {/* file card */}
        {meta && (
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardIcon}>{fileIcon(meta.name)}</div>
              <div>
                <div className={s.cardName}>{meta.name}</div>
                <div className={s.cardCid}>{meta.cid}</div>
              </div>
            </div>

            <div className={s.cardBody}>
              <div className={s.metaGrid}>
                {[
                  ["Size",     formatBytes(meta.size)],
                  ["Views",    meta.views + (meta.maxViews ? ` / ${meta.maxViews}` : "")],
                  ["Uploaded", relTime(meta.uploaded, true)],
                  ["Expires",  meta.expiry ? relTime(meta.expiry) : "Never"],
                ].map(([k,v]) => (
                  <div key={k} className={s.metaCell}>
                    <div className={s.metaCellLabel}>{k}</div>
                    <div className={s.metaCellVal}>{v}</div>
                  </div>
                ))}
              </div>

              <div className={s.decryptSection}>
                <label>Decryption Password</label>
                <div className={s.decryptRow}>
                  <input
                    type="password"
                    className={s.decryptInput}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter the file password"
                    onKeyDown={e => e.key === "Enter" && decryptAndDownload()}
                  />
                </div>
              </div>

              <button
                className={s.downloadBtn}
                onClick={decryptAndDownload}
                disabled={decrypting || !password}
              >
                {decrypting ? "⏳  Decrypting…" : "⬇️  Decrypt & Download"}
              </button>

              {/* access log */}
              <div className={s.accessLog}>
                <div className={s.logTitle}>Access Log (on-chain)</div>
                <div className={s.logEntry}>
                  <span className={s.logEvent}>File registered</span>
                  <span>{relTime(meta.uploaded, true)}</span>
                </div>
                <div className={s.logEntry}>
                  <span className={s.logEvent}>View #{meta.views}</span>
                  <span>just now</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
