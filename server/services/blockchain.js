import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Connect to local hardhat node or RPC provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

// Server wallet / signer (use a private key from your local hardhat node or env)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

// Deployed contract address from your Ignition output
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Minimal ABI for FileShare functions needed by the backend
const CONTRACT_ABI = [
  "function shareFile(bytes32 fileHash, address receiver) external",
  "function revokeFile(bytes32 fileHash) external",
  "function hasAccess(bytes32 fileHash, address user) external view returns (bool)",
  "function getFile(bytes32 fileHash) external view returns (tuple(bytes32 fileHash, address sender, address receiver, uint256 timestamp, bool revoked))"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

/**
 * Record a file share transaction on-chain
 */
export async function recordFileShare(fileHash, receiverAddress) {
  try {
    const tx = await contract.shareFile(fileHash, receiverAddress);
    await tx.wait();
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error("Error recording file share on-chain:", error);
    throw error;
  }
}

/**
 * Revoke file access on-chain
 */
export async function revokeFileShare(fileHash) {
  try {
    const tx = await contract.revokeFile(fileHash);
    await tx.wait();
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error("Error revoking file access on-chain:", error);
    throw error;
  }
}

/**
 * Check if a user has access to a file hash
 */
export async function verifyFileAccess(fileHash, userAddress) {
  try {
    return await contract.hasAccess(fileHash, userAddress);
  } catch (error) {
    console.error("Error verifying access on-chain:", error);
    return false;
  }
}