import { useState, useCallback, useRef } from "react";
import { encryptFile, generatePassword, passwordStrength } from "../lib/encryption";
import { uploadEncrypted } from "../lib/shelby";
import { registerFile } from "../lib/aptos";
import { addFile } from "../lib/registry";
import { formatBytes, truncate, fileIcon, delay, shortAddr } from "../lib/utils";
import s from "../styles/App.module.css";

const EXPIRY_OPTIONS = [
  { label:"1 hour",   val: 3600 },
  { label:"24 hours", val: 86400 },
  { label:"3 days",   val: 259200 },
  { label:"7 days",   val: 604800 },
  { label:"No expiry",val: 0 },
];

const STEPS = [
  { id:"enc",    icon:"🔐", label:"Encrypting file…" },
  { id:"shelby", icon:"📡", label:"Uploading to Shelby…" },
  { id:"aptos",  icon:"⛓️", label:"Registering on Aptos…" },
  { id:"done",   icon:"✅", label:"Complete" },
];

export default function UploadPage({ wallet, showToast }) {
  const [file,        setFile]        = useState(null);
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [expiry,      setExpiry]      = useState(3600);
  const [expiryLabel, setExpiryLabel] = useState("1 hour");
  const [maxViews,    setMaxViews]    = useState(0);
  const [recipient,   setRecipient]   = useState("");
  const [stepState,   setStepState]   = useState({}); // { enc: "active"|"done"|"fail" }
  const [uploading,   setUploading]   = useState(false);
  const [result,      setResult]      = useState(null);
  const fileInputRef = useRef();

  /* ── drag & drop ── */
  const handleDrop = useCallback(e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);
  const pickFile = f => {
    if (f.size > 100 * 1024 * 1024) { showToast("File exceeds 100 MB limit", "error"); return; }
    setFile(f);
  };

  /* ── password ── */
  const strength = passwordStrength(password);
  const strengthColor = ["#FF4757","#FF4757","#F39C12","#2ECC71","#00E5FF","#00E5FF"][strength];
  const strengthWidth = ["10%","30%","50%","70%","90%","100%"][strength];

  /* ── upload ── */
  const startUpload = async () => {
    if (!file)     { showToast("Select a file first", "error"); return; }
    if (!password) { showToast("Enter an encryption password", "error"); return; }

    setUploading(true);
    setResult(null);
    setStepState({});

    try {
      // 1. Encrypt
      setStepState({ enc:"active" });
      const dataUrl = await readFileAsDataUrl(file);
      const cipher  = encryptFile(dataUrl, password);
      setStepState({ enc:"done" });

      // 2. Upload to Shelby
      setStepState(p => ({ ...p, shelby:"active" }));
      const { cid } = await uploadEncrypted(cipher, file.name);
      setStepState(p => ({ ...p, shelby:"done" }));

      // 3. Register on Aptos
      setStepState(p => ({ ...p, aptos:"active" }));
      const expiryTs = expiry ? Math.floor(Date.now() / 1000) + expiry : 0;
      // await registerFile(wallet, { cid, name: file.name, size: file.size, expiryTs, maxViews });
      await delay(900); // remove when wallet wired
      setStepState(p => ({ ...p, aptos:"done" }));

      // 4. Save locally & show result
      setStepState(p => ({ ...p, done:"done" }));
      const record = {
        cid, name: file.name, size: file.size,
        uploaded: Date.now(),
        expiry: expiry ? Date.now() + expiry * 1000 : 0,
        maxViews, views: 0, status: "active",
      };
      addFile(record);
      setResult({ cid, link: `${window.location.origin}/retrieve?cid=${cid}` });
      showToast("File uploaded successfully!", "success");
    } catch (err) {
      showToast(err.message ?? "Upload failed", "error");
      setStepState(p => {
        const active = Object.entries(p).find(([,v]) => v === "active")?.[0];
        return active ? { ...p, [active]:"fail" } : p;
      });
    } finally {
      setUploading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(result.link);
    showToast("Link copied!", "success");
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h2 className={s.title}>Upload &amp; Share</h2>
        <p className={s.sub}>Encrypt, store on Shelby, and register on Aptos — all in one step.</p>
      </div>

      <div className={s.layout}>
        {/* ── left ── */}
        <div>
          {/* drop zone */}
          <div className={s.panel} style={{marginBottom:16}}>
            <div className={s.panelTitle}>File</div>
            <div
              className={`${s.dropZone} ${file ? s.hasFile : ""}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <span className={s.dzIcon}>{file ? fileIcon(file.name) : "📂"}</span>
              <div className={s.dzText}>{file ? "File selected" : "Drop file here or click to browse"}</div>
              <div className={s.dzSub}>{file ? formatBytes(file.size) : "Any format · max 100 MB"}</div>
              {file && <div className={s.dzName}>{file.name}</div>}
            </div>
            <input ref={fileInputRef} type="file" style={{display:"none"}}
              onChange={e => pickFile(e.target.files[0])} />
          </div>

          {/* encryption */}
          <div className={s.panel} style={{marginBottom:16}}>
            <div className={s.panelTitle}>Encryption</div>
            <div className={s.field}>
              <label>Password / Key</label>
              <div className={s.pwRow}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  autoComplete="new-password"
                />
                <button className={s.iconBtn} onClick={() => setShowPw(p => !p)}>👁</button>
                <button className={s.iconBtn} onClick={() => {
                  const k = generatePassword();
                  setPassword(k); setShowPw(true);
                  showToast("Random key generated — save it now!", "info");
                }}>🎲</button>
              </div>
              <div className={s.strengthBar}>
                <div style={{ width: strengthWidth, background: strengthColor, height:"100%", borderRadius:2, transition:"all .3s" }} />
              </div>
            </div>
          </div>

          {/* access control */}
          <div className={s.panel}>
            <div className={s.panelTitle}>Access Control</div>
            <div className={s.field}>
              <label>Expiry</label>
              <div className={s.chips}>
                {EXPIRY_OPTIONS.map(o => (
                  <div key={o.val}
                    className={`${s.chip} ${expiry === o.val ? s.chipActive : ""}`}
                    onClick={() => { setExpiry(o.val); setExpiryLabel(o.label); }}>
                    {o.label}
                  </div>
                ))}
              </div>
            </div>
            <div className={s.field} style={{marginTop:14}}>
              <label>Max Views (0 = unlimited)</label>
              <input type="number" value={maxViews} min={0} max={9999}
                onChange={e => setMaxViews(parseInt(e.target.value)||0)}
                style={{maxWidth:120}} />
            </div>
            <div className={s.field} style={{marginTop:14}}>
              <label>Recipient wallet (optional)</label>
              <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
                placeholder="0x… Aptos address" />
            </div>
          </div>
        </div>

        {/* ── right ── */}
        <div>
          <div className={s.panel} style={{marginBottom:16}}>
            <div className={s.panelTitle}>Summary</div>
            {[
              ["File",       file ? truncate(file.name, 18) : "—"],
              ["Size",       file ? formatBytes(file.size) : "—"],
              ["Encryption", "AES-256", "ok"],
              ["Storage",    "Shelby (Testnet)", "ok"],
              ["Chain",      "Aptos Testnet", "ok"],
              ["Expiry",     expiryLabel],
              ["Wallet",     wallet ? shortAddr(wallet) : "Not connected", wallet ? "ok" : "warn"],
            ].map(([k,v,cls]) => (
              <div key={k} className={s.infoRow}>
                <span className={s.infoKey}>{k}</span>
                <span className={`${s.infoVal} ${cls ? s[cls] : ""}`}>{v}</span>
              </div>
            ))}
          </div>

          <div className={s.warningBox}>
            ⚠️ Save your password separately. Files cannot be decrypted without it. DropChain never stores your key.
          </div>

          <button className={s.uploadBtn} disabled={uploading} onClick={startUpload}>
            🚀&nbsp;&nbsp;Encrypt &amp; Upload
          </button>

          {/* steps */}
          {Object.keys(stepState).length > 0 && (
            <div className={s.steps}>
              {STEPS.map(step => {
                const st = stepState[step.id];
                return (
                  <div key={step.id} className={`${s.step} ${st ? s["step_"+st] : ""}`}>
                    <span className={s.stepIcon}>
                      {st === "active" ? <span className="spin">⟳</span>
                       : st === "done" ? "✓"
                       : st === "fail" ? "✗"
                       : step.icon}
                    </span>
                    {step.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* result */}
          {result && (
            <div className={s.resultCard}>
              <div className={s.resultLabel}>✓ File shared successfully</div>
              <div className={s.resultLink} onClick={copyLink}>
                <span style={{wordBreak:"break-all", fontSize:".78rem"}}>{result.link}</span>
                <span style={{fontSize:".7rem", color:"var(--muted)", whiteSpace:"nowrap"}}>click to copy</span>
              </div>
              <div style={{fontSize:".72rem", color:"var(--muted)", marginTop:8, fontFamily:"var(--font-mono)"}}>
                CID: {result.cid}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = () => rej(new Error("Failed to read file"));
    r.readAsDataURL(file); // handles ALL file types correctly
  });
}
