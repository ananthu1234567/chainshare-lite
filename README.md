# 🛡️ ChainShare Lite

> A secure, decentralized, WhatsApp-inspired file transfer system built with browser-native cryptography, a MERN stack backend, and Solidity smart contracts enforcing on-chain access control.

---

## ✨ Features

* **Zero-Knowledge Client-Side Encryption:** Files are fully encrypted and decrypted directly in the browser using **AES-256-GCM** and **SHA-256** via the native Web Crypto API. The server never sees plain text data or encryption passwords.
* **Smart Contract Access Control:** Access rights (`share`, `revoke`, `hasAccess`) are immutably managed on-chain via a custom Solidity smart contract (`FileShare.sol`).
* **On-Chain Server Guard:** The backend verifies access permissions directly against the blockchain before streaming any encrypted file binaries to a requester.
* **Sleek Cyber-Emerald UI:** A modern glassmorphic dark-mode interface complete with an automated wallet address-detection badge and real-time step transfer status logs.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Ethers.js v6
* **Backend:** Node.js, Express, Multer, Mongoose / MongoDB
* **Smart Contracts:** Solidity, Hardhat v3, Hardhat Ignition, Mocha & Chai
* **Cryptography:** Web Crypto API (AES-256-GCM, SHA-256)

---
