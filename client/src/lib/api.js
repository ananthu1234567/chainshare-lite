const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function uploadEncrypted(bytes, label, uploader) {
  const fd = new FormData();
  fd.append("file", new Blob([bytes]), "data.bin");
  fd.append("label", label || "");
  fd.append("uploader", uploader);
  const r = await fetch(`${BASE}/files`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Upload failed");
  return r.json(); // { fileHash }
}

export async function getInfo(hashes) {
  if (!hashes.length) return {};
  const r = await fetch(`${BASE}/files/info?hashes=${hashes.join(",")}`);
  return r.json();
}