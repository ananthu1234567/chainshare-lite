import { useState } from "react";
import { encryptFile, decryptFile, sha256Hex } from "./lib/crypto";
import { uploadEncrypted } from "./lib/api";
import { saveFile } from "./lib/saveFile";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const DUMMY = "0x0000000000000000000000000000000000000001";

export default function App() {
  const [file, setFile] = useState(null);
  const [pw, setPw] = useState("");
  const [status, setStatus] = useState("Ready to encrypt and transfer.");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function roundTrip() {
    if (!file || pw.length < 10) return;
    setLoading(true);
    setIsError(false);
    try {
      setStatus("Encrypting file in browser (AES-256-GCM)...");
      const enc = await encryptFile(file, pw);
      
      setStatus("Computing file SHA-256 hash...");
      const hash = await sha256Hex(enc);

      setStatus("Uploading encrypted payload to server...");
      await uploadEncrypted(enc, file.name, DUMMY);

      setStatus("Fetching encrypted payload back for verification...");
      const res = await fetch(`${BASE}/files/${hash}/raw`);
      if (!res.ok) throw new Error("Download failed from server");
      const bytes = new Uint8Array(await res.arrayBuffer());

      setStatus("Decrypting file locally...");
      const out = await decryptFile(bytes, pw);

      setStatus(`Success! Decrypted & saved: ${out.name}`);
      saveFile(out.name, out.type, out.data);
    } catch (e) {
      setIsError(true);
      setStatus("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#0b141a",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: 16
    }}>
      {/* Main Chat Container */}
      <div style={{
        width: "100%",
        maxWidth: 460,
        height: 620,
        backgroundColor: "#111b21",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
        border: "1px solid #222e35"
      }}>
        
        {/* WhatsApp Top Header */}
        <div style={{
          backgroundColor: "#202c33",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid #2a3942"
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#00a884",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "#111b21",
            fontSize: 18
          }}>
            🔒
          </div>
          <div>
            <div style={{ color: "#e9edef", fontWeight: 600, fontSize: 16 }}>
              ChainShare - Version 1
            </div>
            <div style={{ color: "#00a884", fontSize: 12 }}>
              end-to-end encrypted transfer
            </div>
          </div>
        </div>

        {/* Chat Log / Message Area */}
        <div style={{
          flex: 1,
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          backgroundColor: "#0b141a",
          backgroundImage: "radial-gradient(#1f2c33 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
          {/* Default Encryption Notice Banner */}
          <div style={{
            alignSelf: "center",
            backgroundColor: "#182229",
            color: "#ffd279",
            fontSize: 12,
            padding: "8px 14px",
            borderRadius: 8,
            textAlign: "center",
            maxWidth: "88%",
            marginBottom: 4
          }}>
            🔐 Files are encrypted in your browser with AES-256-GCM before leaving your device.
          </div>

          {/* Clean Status Message Bubble */}
          <div style={{
            alignSelf: isError ? "flex-start" : "flex-end",
            backgroundColor: isError ? "#3b1d22" : "#005c4b",
            color: "#e9edef",
            padding: "10px 14px",
            borderRadius: 10,
            borderTopRightRadius: isError ? 10 : 2,
            borderTopLeftRadius: isError ? 2 : 10,
            maxWidth: "85%",
            fontSize: 13.5,
            wordBreak: "break-word",
            boxShadow: "0 1px 1px rgba(0,0,0,0.25)"
          }}>
            {status}
          </div>
        </div>

        {/* Bottom Input Bar */}
        <div style={{
          backgroundColor: "#202c33",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          borderTop: "1px solid #2a3942"
        }}>
          {/* File Attachment Button */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#2a3942",
            color: file ? "#e9edef" : "#8696a0",
            padding: "10px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
          }}>
            <span style={{ fontSize: 18 }}>📎</span>
            <span>{file ? file.name : "Attach a file to encrypt..."}</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: "none" }}
            />
          </label>

          {/* Password + Send Row */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              placeholder="Password (min 10 chars)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: "#2a3942",
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#e9edef",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              onClick={roundTrip}
              disabled={!file || pw.length < 10 || loading}
              title="Encrypt, upload & download"
              style={{
                backgroundColor: (!file || pw.length < 10 || loading) ? "#2a3942" : "#00a884",
                color: (!file || pw.length < 10 || loading) ? "#8696a0" : "#111b21",
                border: "none",
                borderRadius: 8,
                padding: "0 18px",
                fontWeight: 600,
                fontSize: 14,
                cursor: (!file || pw.length < 10 || loading) ? "not-allowed" : "pointer",
                transition: "background-color 0.2s"
              }}
            >
              {loading ? "..." : "Send ➤"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}