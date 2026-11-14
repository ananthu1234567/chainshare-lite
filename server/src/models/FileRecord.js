import mongoose from "mongoose";

const schema = new mongoose.Schema({
  fileHash: { type: String, required: true, unique: true, lowercase: true }, // 0x + hash
  label: { type: String, default: "", maxlength: 80 }, // optional, NOT encrypted
  sizeBytes: { type: Number, required: true },
  uploader: { type: String, required: true, lowercase: true },
  createdAt: { type: Date, default: Date.now },
});

export const FileRecord = mongoose.model("FileRecord", schema);
