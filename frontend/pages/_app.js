import "../styles/globals.css";
import Head from "next/head";
import { useState, useCallback } from "react";
import Layout from "../components/Layout";
import Toast from "../components/Toast";

export default function App({ Component, pageProps }) {
  const [wallet, setWallet]   = useState(null);
  const [toast,  setToast]    = useState({ message:"", type:"info" });

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  const connectWallet = useCallback(async () => {
    // ── Production: use Petra / @aptos-labs/wallet-adapter-react ───
    // const { connect, account, connected, disconnect } = useWallet();
    // if (connected) { disconnect(); setWallet(null); return; }
    // await connect("Petra");
    // setWallet(account.address);

    // ── Dev stub ───────────────────────────────────────────────────
    if (wallet) {
      setWallet(null);
      showToast("Wallet disconnected", "info");
      return;
    }
    const fake = "0x" + [...Array(40)].map(()=>Math.floor(Math.random()*16).toString(16)).join("");
    setWallet(fake);
    showToast("Wallet connected ✓", "success");
  }, [wallet, showToast]);

  return (
    <>
      <Head>
        <title>DropChain — Decentralized File Sharing</title>
        <meta name="description" content="E2E encrypted, on-chain access control, temporary file sharing powered by Shelby Protocol and Aptos." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <Layout wallet={wallet} onConnect={connectWallet}>
        <Component {...pageProps} wallet={wallet} showToast={showToast} />
      </Layout>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message:"", type:"info" })}
      />
    </>
  );
}
