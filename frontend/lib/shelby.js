/**
 * Browser-side Shelby helper.
 * Uses the server-side API route (/api/shelby-upload) for actual uploads
 * so the secret server key is never exposed to the browser.
 */

/**
 * Upload encrypted data via the Next.js API route.
 * @param {string} encryptedData  - base64 / ciphertext string
 * @param {string} filename       - original file name (stored as metadata)
 * @returns {{ cid: string }}
 */
export async function uploadEncrypted(encryptedData, filename) {
  const res = await fetch("/api/shelby-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: encryptedData, filename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Upload failed (${res.status})`);
  }
  return res.json(); // { cid }
}

/**
 * Download a blob from Shelby by CID.
 * @param {string} cid
 * @returns {string} the stored string (ciphertext)
 */
export async function downloadByCid(cid) {
  const res = await fetch("/api/shelby-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cid }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Download failed (${res.status})`);
  }
  const { data } = await res.json();
  return data;
}
