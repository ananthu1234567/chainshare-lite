import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { encryptFile, decryptFile, sha256Hex } from "./lib/crypto";
import { uploadEncrypted } from "./lib/api";
import { saveFile } from "./lib/saveFile";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function shareFile(bytes32 fileHash, address receiver) external"
];

export default function App() {
  const [file, setFile] = useState(null);
  const [pw, setPw] = useState("");
  const [receiver, setReceiver] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("Connect wallet and attach a file to begin.");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-detect wallet if already connected
  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet check error:", err);
      }
    }
  }

  async function handleConnectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
      setStatus("Wallet connected: " + accounts[0].slice(0, 6) + "...");
    } catch (err) {
      alert("Connection failed: " + err.message);
    }
  }

  async function roundTrip() {
    if (!file || pw.length < 10 || !ethers.isAddress(receiver)) return;
    setLoading(true);
    setIsError(false);
    try {
      if (!window.ethereum) throw new Error("MetaMask is required");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const uploader = accounts[0];
      setWalletAddress(uploader);

      setStatus("🔐 Encrypting file in browser (AES-256-GCM)...");
      const enc = await encryptFile(file, pw);
      
      setStatus("🧮 Computing file SHA-256 hash...");
      const hash = await sha256Hex(enc);

      setStatus("☁️ Uploading encrypted payload to server...");
      await uploadEncrypted(enc, file.name, uploader);

      setStatus("⛓️ Submitting share transaction to blockchain...");
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.shareFile(hash, receiver);
      await tx.wait();

      setStatus("📡 Notifying backend of smart contract state...");
      await fetch(`${BASE}/files/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileHash: hash, receiverAddress: receiver })
      });

      setStatus("🔍 Verifying access & downloading payload...");
      const res = await fetch(`${BASE}/files/${hash}/download?requester=${receiver}`);
      if (!res.ok) throw new Error("Download denied by smart contract policy");
      const bytes = new Uint8Array(await res.arrayBuffer());

      setStatus("🔓 Decrypting file locally...");
      const out = await decryptFile(bytes, pw);

      setStatus(`✨ Success! Shared on-chain & downloaded: ${out.name}`);
      saveFile(out.name, out.type, out.data);
    } catch (e) {
      setIsError(true);
      setStatus("Error: " + (e.reason || e.message));
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
      backgroundColor: "#070d12",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: 16
    }}>
      {/* Main Glassmorphic Container */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        height: 720,
        backgroundColor: "#111b21ee",
        backdropFilter: "blur(12px)",
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        
        {/* Header with Wallet Helper */}
        <div style={{
          backgroundColor: "#1f2c34",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #2a3942"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              backgroundColor: "#00a884",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 4px 12px rgba(0,168,132,0.3)"
            }}>
              🔒
            </div>
            <div>
              <div style={{ color: "#e9edef", fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
                ChainShare Lite
              </div>
              <div style={{ color: "#00a884", fontSize: 11, fontWeight: 500 }}>
                ● Decentralized E2EE
              </div>
            </div>
          </div>

          {/* Connect / Address Badge Button */}
          <button
            onClick={handleConnectWallet}
            title={walletAddress ? "Connected Address (Click to copy)" : "Connect MetaMask"}
            style={{
              backgroundColor: walletAddress ? "#182229" : "#00a884",
              color: walletAddress ? "#00a884" : "#111b21",
              border: walletAddress ? "1px solid #00a884" : "none",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>

        {/* Chat / Status Screen Area */}
        <div style={{
          flex: 1,
          padding: 24,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          backgroundColor: "#0b141a",
          backgroundImage: "radial-gradient(#1f2c33 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}>
          {/* Info Banner */}
          <div style={{
            backgroundColor: "rgba(24,34,41,0.9)",
            color: "#ffd279",
            fontSize: 12.5,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,210,121,0.15)",
            lineHeight: 1.5
          }}>
            🛡️ <b>Secure Transfer:</b> Files are encrypted client-side and access rights are enforced on-chain via Smart Contracts.
          </div>

          {/* Dynamic Status Card */}
          <div style={{
            alignSelf: "stretch",
            backgroundColor: isError ? "#3b1d22" : "#112229",
            color: isError ? "#ff8085" : "#e9edef",
            border: `1px solid ${isError ? "#5c2b32" : "#005c4b"}`,
            padding: "16px",
            borderRadius: 14,
            fontSize: 13.5,
            lineHeight: 1.5,
            wordBreak: "break-word",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: 11, color: "#8696a0", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Status Log
            </div>
            {status}
          </div>
        </div>

        {/* Bottom Control Hub */}
        <div style={{
          backgroundColor: "#1f2c34",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderTop: "1px solid #2a3942"
        }}>
          {/* File Selector */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#111b21",
            color: file ? "#e9edef" : "#8696a0",
            padding: "12px 16px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13.5,
            border: "1px dashed #2a3942",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
          }}>
            <span style={{ fontSize: 18 }}>📎</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {file ? file.name : "Click to select a file to encrypt..."}
            </span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: "none" }}
            />
          </label>

          {/* Recipient Address */}
          <input
            type="text"
            placeholder="Recipient Wallet Address (0x...)"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            style={{
              backgroundColor: "#111b21",
              border: "1px solid #2a3942",
              borderRadius: 10,
              padding: "12px 16px",
              color: "#e9edef",
              fontSize: 13.5,
              outline: "none"
            }}
          />

          {/* Password & Send Row */}
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="password"
              placeholder="Encryption Password (min 10 chars)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: "#111b21",
                border: "1px solid #2a3942",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#e9edef",
                fontSize: 13.5,
                outline: "none"
              }}
            />
            <button
              onClick={roundTrip}
              disabled={!file || pw.length < 10 || !ethers.isAddress(receiver) || loading}
              style={{
                backgroundColor: (!file || pw.length < 10 || !ethers.isAddress(receiver) || loading) ? "#2a3942" : "#00a884",
                color: (!file || pw.length < 10 || !ethers.isAddress(receiver) || loading) ? "#8696a0" : "#070d12",
                border: "none",
                borderRadius: 10,
                padding: "0 22px",
                fontWeight: 700,
                fontSize: 14,
                cursor: (!file || pw.length < 10 || !ethers.isAddress(receiver) || loading) ? "not-allowed" : "pointer",
                boxShadow: (!file || pw.length < 10 || !ethers.isAddress(receiver) || loading) ? "none" : "0 4px 14px rgba(0,168,132,0.4)"
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