# DropChain — Decentralized Temporary File Sharing

End-to-end encrypted file sharing on Aptos + Shelby Protocol.

```
dropchain/
├── frontend/               # Next.js 14 app
│   ├── components/
│   │   ├── Layout.js       # Nav, canvas background
│   │   └── Toast.js        # Notification toasts
│   ├── lib/
│   │   ├── aptos.js        # Aptos client + Move call helpers
│   │   ├── encryption.js   # AES-256 encrypt/decrypt, password utils
│   │   ├── registry.js     # Local file registry (localStorage mirror)
│   │   ├── shelby.js       # Shelby upload/download via API routes
│   │   └── utils.js        # Shared formatting helpers
│   ├── pages/
│   │   ├── _app.js         # Global wrapper, wallet state, toasts
│   │   ├── index.js        # Landing page
│   │   ├── app.js          # Upload page
│   │   ├── dashboard.js    # File dashboard
│   │   ├── retrieve.js     # File viewer / download
│   │   ├── file/[id].js    # Legacy redirect → /retrieve?cid=
│   │   └── api/
│   │       ├── shelby-upload.js    # Server-side Shelby upload
│   │       └── shelby-download.js  # Server-side Shelby download
│   ├── styles/
│   │   ├── globals.css
│   │   ├── Home.module.css
│   │   ├── App.module.css
│   │   ├── Dashboard.module.css
│   │   └── Retrieve.module.css
│   ├── .env.local.example
│   ├── next.config.js
│   └── package.json
└── move/                   # Aptos Move smart contract
    ├── Move.toml
    └── sources/
        └── file_registry.move
```

---

## Quick Start

### 1. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# fill in your keys (see below)
npm install
npm run dev        # http://localhost:3000
```

### 2. Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SHELBY_API_KEY` | Browser-safe Shelby key |
| `SHELBY_SERVER_API_KEY` | Server-only Shelby key (API routes) |
| `NEXT_PUBLIC_APTOS_API_KEY` | Aptos fullnode API key |
| `NEXT_PUBLIC_MODULE_ADDRESS` | Deployed Move module address |
| `NEXT_PUBLIC_APTOS_NETWORK` | `testnet` / `mainnet` / `devnet` |

### 3. Deploy Move Contract

```bash
cd move
aptos init --profile testnet
aptos move publish \
  --profile testnet \
  --named-addresses file_share=<YOUR_ADDRESS>
```

Copy the deployed address into `NEXT_PUBLIC_MODULE_ADDRESS`.

### 4. Deploy Frontend (Vercel)

```bash
cd frontend
npx vercel --prod
# set env vars in Vercel dashboard
```

---

## Architecture

```
Browser
  │
  ├─ FileReader.readAsDataURL()   ← reads ANY file type (not just text)
  ├─ AES-256 encrypt (CryptoJS)   ← client-side, password never sent
  │
  ▼
Next.js API Route (/api/shelby-upload)
  └─ ShelbyNodeClient.storage.upload()  ← server key, returns CID
  │
  ▼
Aptos Move (file_share::registry)
  ├─ register_file(cid, name, size, expiry_ts, max_views)
  ├─ revoke_file(cid)
  ├─ increment_views(owner, cid)
  └─ is_accessible(owner, cid)  ← view function, no gas
```

---

## Security Notes

- Encryption happens **entirely in the browser** before the file leaves the device.
- The server API key (`SHELBY_SERVER_API_KEY`) is never exposed to the browser.
- Passwords are **never stored** anywhere — lose it, lose the file.
- On-chain expiry and view-count enforcement is trustless (Move VM).
- `readAsDataURL` is used (not `readAsText`) so binary files work correctly.
