
import { Router } from "express";
import multer from "multer";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isAddress } from "ethers";
import { FileRecord } from "../models/FileRecord.js";

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

// TEMPORARY (Week 1 only). Delete this route in Week 3 and replace it with the guard
router.get("/:hash/raw", async (req, res) => {
  const hash = req.params.hash.toLowerCase();
  if (!HASH_RE.test(hash)) return res.status(400).json({ error: "Bad hash" });
  res.sendFile(path.join(UPLOAD_DIR, `${hash}.bin`));
});

export default router;
/* [cite: 1, 11] */