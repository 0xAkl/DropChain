/**
 * POST /api/shelby-download
 * Body: { cid: string }
 *
 * Fetches encrypted blob from Shelby by CID.
 * Returns: { data: string }
 */

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

  const { cid } = req.body ?? {};
  if (!cid) return res.status(400).json({ message: "Missing cid" });

  try {
    // ── Production ──────────────────────────────────────────────────
    // const blob = await client.storage.download({ cid });
    // const data = blob.toString("utf8");
    // return res.json({ data });

    // ── Development stub ────────────────────────────────────────────
    return res.status(404).json({ message: "CID not found in stub mode. Connect real Shelby keys." });
  } catch (err) {
    console.error("[shelby-download]", err);
    return res.status(500).json({ message: err.message ?? "Download failed" });
  }
}
