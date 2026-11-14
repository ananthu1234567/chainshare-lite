import { useState } from "react";
import { encryptFile, decryptFile, sha256Hex } from "./lib/crypto";
import { uploadEncrypted } from "./lib/api";
import { saveFile } from "./lib/saveFile";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const DUMMY = "0x0000000000000000000000000000000000000001";

export default function App() {
  const [file, setFile] = useState(null);
  const [pw, setPw] = useState("");
  const [log, setLog] = useState([]);

  const add = (m) => setLog((l) => [...l, m]);

  async function roundTrip() {
    try {
      add("Encrypting...");
      const enc = await encryptFile(file, pw);
      const hash = await sha256Hex(enc);
      add("Hash: " + hash);

      const up = await uploadEncrypted(enc, "test", DUMMY);
      add("Uploaded. Server hash matches: " + (up.fileHash === hash));

      const res = await fetch(`${BASE}/files/${hash}/raw`);
      if (!res.ok) throw new Error("Download failed");
      const bytes = new Uint8Array(await res.arrayBuffer());

      const out = await decryptFile(bytes, pw);
      add("Decrypted " + out.name);
      saveFile(out.name, out.type, out.data);
    } catch (e) {
      add("Error: " + e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Chainshare - Version 1</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} /><br/><br/>
      <input type="password" placeholder="password (min 10 chars)" value={pw} onChange={(e) => setPw(e.target.value)} /><br/><br/>
      <button onClick={roundTrip} disabled={!file || pw.length < 10}>
        Encrypt, upload & download
      </button>
      <pre>{log.join("\n")}</pre>
    </div>
  );
}