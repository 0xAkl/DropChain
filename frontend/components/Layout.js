import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { shortAddr } from "../lib/utils";

export default function Layout({ children, wallet, onConnect }) {
  const router = useRouter();
  const canvasRef = useRef(null);

  /* ── particle canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.6 ? 185 : 272,
    }));

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      // grid
      ctx.strokeStyle = "rgba(0,229,255,0.025)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y = 0; y < h; y += 80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
      // particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,70%,${p.alpha})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        particles.forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
            ctx.strokeStyle = `rgba(0,229,255,${(1 - d/120)*0.04})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const navLinks = [
    { href: "/",          label: "Home" },
    { href: "/app",       label: "Upload" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/retrieve",  label: "Retrieve" },
  ];

  return (
    <>
      <canvas ref={canvasRef} style={canvasStyle} />
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>DropChain</Link>
        <div style={{ display:"flex", gap:6 }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} style={{
              ...navBtnBase,
              ...(router.pathname === l.href ? navBtnActive : {}),
            }}>{l.label}</Link>
          ))}
        </div>
        <button onClick={onConnect} style={wallet ? walletConnectedStyle : walletBtnStyle}>
          {wallet ? shortAddr(wallet) : "Connect Wallet"}
        </button>
      </nav>
      <main style={{ position:"relative", zIndex:1, paddingTop:80 }}>
        {children}
      </main>
    </>
  );
}

const canvasStyle = {
  position:"fixed", top:0, left:0, width:"100%", height:"100%",
  pointerEvents:"none", zIndex:0, opacity:.45,
};
const navStyle = {
  position:"fixed", top:0, left:0, right:0, zIndex:100,
  display:"flex", alignItems:"center", justifyContent:"space-between",
  padding:"18px 40px",
  background:"rgba(4,4,10,0.85)", backdropFilter:"blur(20px)",
  borderBottom:"1px solid rgba(255,255,255,0.07)",
};
const logoStyle = {
  fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.35rem",
  letterSpacing:"-0.02em", textDecoration:"none",
  background:"linear-gradient(135deg,#00E5FF,#7B2FBE)",
  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
};
const navBtnBase = {
  background:"none", border:"1px solid transparent",
  color:"var(--muted)", fontFamily:"var(--font-body)", fontSize:".82rem",
  padding:"7px 16px", borderRadius:8, cursor:"pointer", textDecoration:"none",
  display:"inline-block",
};
const navBtnActive = {
  color:"var(--cyan)", borderColor:"rgba(0,229,255,.2)",
  background:"rgba(0,229,255,.05)",
};
const walletBtnStyle = {
  background:"linear-gradient(135deg,#00E5FF,#7B2FBE)",
  border:"none", color:"#000", fontFamily:"var(--font-display)", fontWeight:700,
  fontSize:".8rem", padding:"8px 20px", borderRadius:8, cursor:"pointer",
  letterSpacing:".04em",
};
const walletConnectedStyle = {
  background:"rgba(255,255,255,.035)", border:"1px solid #2ECC71",
  color:"#2ECC71", fontFamily:"var(--font-mono)", fontSize:".73rem",
  padding:"8px 16px", borderRadius:8, cursor:"pointer",
};
