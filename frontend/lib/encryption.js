import CryptoJS from "crypto-js";

/**
 * Encrypt a file's base64 data-URL string with AES-256.
 * The password is provided by the user — never hardcoded.
 * @param {string} dataUrl  - result of FileReader.readAsDataURL()
 * @param {string} password - user-supplied key
 * @returns {string} ciphertext string
 */
export function encryptFile(dataUrl, password) {
  if (!password) throw new Error("Encryption password is required");
  return CryptoJS.AES.encrypt(dataUrl, password).toString();
}

/**
 * Decrypt a ciphertext back to the original data-URL.
 * @param {string} cipher   - ciphertext from encryptFile()
 * @param {string} password - same password used during encryption
 * @returns {string} original data-URL, or throws if password is wrong
 */
export function decryptFile(cipher, password) {
  if (!password) throw new Error("Decryption password is required");
  const bytes = CryptoJS.AES.decrypt(cipher, password);
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) throw new Error("Wrong password or corrupted data");
  return result;
}

/** Measure password strength 0–5 */
export function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)               score++;
  if (pw.length >= 14)              score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))      score++;
  return score;
}

/** Generate a cryptographically random passphrase */
export function generatePassword(length = 22) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join("");
}

/** Trigger a browser download of a data-URL */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
