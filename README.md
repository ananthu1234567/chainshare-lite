# ChainShare Lite 🔒

A secure, WhatsApp-inspired file transfer system where files are encrypted directly in the browser, stored securely on an Express server, and access permissions are enforced via a Solidity smart contract on the blockchain[cite: 1, 2].

---

## 🚀 The Problem & Solution

* **The Problem:** Traditional file-sharing platforms let server administrators read every file, and there is no cryptographic proof that files haven't been tampered with.
* **The Solution:** 
  1. **Client-Side Encryption:** Files are encrypted in the browser using **AES-256-GCM** with a key derived via **PBKDF2** (600,000 iterations) from a user password[cite: 2, 8]. The server only ever receives unreadable binary bytes[cite: 2].
  2. **Blockchain Verification:** The **SHA-256 hash** of the encrypted file is logged to a local smart contract along with the sender, receiver, and timestamp[cite: 2].
  3. **Signed Access Control:** To download a file, the receiver signs a message using **MetaMask** (no gas required), and the Express server verifies permissions directly against the blockchain before serving the file[cite: 2, 3, 23].

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite template), React Router, MetaMask, Ethers.js v6[cite: 5]
* **Backend:** Node.js, Express, Multer, Mongoose (MongoDB)[cite: 7]
* **Cryptography:** Browser-native **Web Crypto API** (AES-256-GCM, PBKDF2, SHA-256)[cite: 1, 5, 8]
* **Blockchain:** Solidity (`^0.8.24`), Hardhat (local chain), Hardhat Ignition[cite: 4, 5, 15, 18]

---
