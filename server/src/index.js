import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import filesRouter from "./routes/files.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/files", filesRouter);

// Error handler (must be last)[cite: 12]
app.use((err, req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

await mongoose.connect(process.env.MONGO_URI);
app.listen(process.env.PORT || 4000, () => {
  console.log(`API on http://localhost:${process.env.PORT || 4000}`);
});