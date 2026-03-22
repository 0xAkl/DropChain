/**
 * POST /api/shelby-upload
 * Body: { data: string (encrypted ciphertext), filename: string }
 *
 * Uploads to Shelby using the server-side API key (never exposed to browser).
 * Returns: { cid: string }
 */

// Uncomment when @shelby-protocol/sdk is available:
// import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
// import { Network } from "@aptos-labs/ts-sdk";
//
// const client = new ShelbyNodeClient({
//   network: Network.TESTNET,
//   apiKey: process.env.SHELBY_SERVER_API_KEY,
// });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { data, filename } = req.body ?? {};

  if (!data || typeof data !== "string") {
    return res.status(400).json({ message: "Missing or invalid `data` field" });
  }

  try {
    // ── Production ──────────────────────────────────────────────────
    // const upload = await client.storage.upload({
    //   data: Buffer.from(data),
    //   metadata: { filename: filename ?? "unknown" },
    // });
    // return res.json({ cid: upload.cid });

    // ── Development stub ────────────────────────────────────────────
    // Replace with real SDK call above once keys are configured.
    const fakeCid = "bafybei" + [...Array(38)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");

    return res.json({ cid: fakeCid });
  } catch (err) {
    console.error("[shelby-upload]", err);
    return res.status(500).json({ message: err.message ?? "Upload failed" });
  }
}
