/**
 * Local registry — mirrors the on-chain state for the current user's files.
 * In production this would be hydrated from Aptos via getFileRecord().
 */

const KEY = "dc_files_v2";

export function loadRegistry() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRegistry(files) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(files));
}

export function addFile(file) {
  const files = loadRegistry();
  files.unshift(file);
  saveRegistry(files);
  return files;
}

export function updateFile(cid, patch) {
  const files = loadRegistry().map(f => f.cid === cid ? { ...f, ...patch } : f);
  saveRegistry(files);
  return files;
}

export function getFile(cid) {
  return loadRegistry().find(f => f.cid === cid) ?? null;
}

export function isAccessible(file) {
  if (!file) return { ok: false, reason: "File not found" };
  if (file.status === "revoked") return { ok: false, reason: "Access revoked by owner" };
  if (file.expiry && file.expiry < Date.now()) return { ok: false, reason: "This file has expired" };
  if (file.maxViews && file.views >= file.maxViews)
    return { ok: false, reason: `Max view count (${file.maxViews}) reached` };
  return { ok: true };
}
