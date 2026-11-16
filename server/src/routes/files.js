import { Router } from "express";
import multer from "multer";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isAddress } from "ethers";
import { FileRecord } from "../models/FileRecord.js";
import { recordFileShare, verifyFileAccess, revokeFileShare } from "../../services/blockchain.js";

const router = Router();
const UPLOAD_DIR = path.resolve("uploads");
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const MAX_BYTES = Number(process.env.MAX_FILE_MB || 50) * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } });

export const HASH_RE = /^0x[a-f0-9]{64}$/; // also protects against path traversal

// Upload encrypted bytes
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file received" });
  const uploader = String(req.body.uploader || "").toLowerCase();
  if (!isAddress(uploader)) return res.status(400).json({ error: "Invalid uploader address" });
  
  const fileHash = "0x" + createHash("sha256").update(req.file.buffer).digest("hex");
  await fs.writeFile(path.join(UPLOAD_DIR, `${fileHash}.bin`), req.file.buffer);
  
  await FileRecord.updateOne(
    { fileHash },
    {
      setOnInsert: {
        fileHash,
        label: String(req.body.label || "").slice(0, 80),
        sizeBytes: req.file.size,
        uploader,
      },
    },
    { upsert: true }
  );
  
  return res.status(201).json({ fileHash });
});

// Record a file share event on-chain
router.post("/share", async (req, res) => {
  try {
    const { fileHash, receiverAddress } = req.body;
    if (!HASH_RE.test(fileHash) || !isAddress(receiverAddress)) {
      return res.status(400).json({ error: "Invalid fileHash or receiverAddress format" });
    }

    const tx = await recordFileShare(fileHash, receiverAddress);
    return res.status(200).json({ success: true, txHash: tx.txHash });
  } catch (error) {
    console.error("On-chain share error:", error);
    return res.status(500).json({ error: error.message || "Failed to record share on-chain" });
  }
});

// Labels and sizes for a list of hashes: /api/files/info?hashes=0x..,0x..
router.get("/info", async (req, res) => {
  const hashes = String(req.query.hashes || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => HASH_RE.test(h))
    .slice(0, 100);
    
  const rows = await FileRecord.find({ fileHash: { $in: hashes } });
  const out = {};
  for (const r of rows) out[r.fileHash] = { label: r.label, sizeBytes: r.sizeBytes };
  res.json(out);
});

// Guarded download route replacing the temporary raw route
router.get("/:hash/download", async (req, res) => {
  const hash = req.params.hash.toLowerCase();
  const requester = String(req.query.requester || "").toLowerCase();

  if (!HASH_RE.test(hash)) return res.status(400).json({ error: "Bad hash" });
  if (!isAddress(requester)) return res.status(400).json({ error: "Invalid requester address" });

  // Verify on-chain access via the deployed smart contract
  const hasAccess = await verifyFileAccess(hash, requester);
  if (!hasAccess) {
    return res.status(403).json({ error: "Access denied by smart contract policy" });
  }

  res.sendFile(path.join(UPLOAD_DIR, `${hash}.bin`));
});

export default router;