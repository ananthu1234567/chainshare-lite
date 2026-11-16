import { ethers } from "ethers";

// ABI matching your deployed FileShare contract functions
const CONTRACT_ABI = [
  "function shareFile(bytes32 fileHash, address receiver) external",
  "function revokeFile(bytes32 fileHash) external",
  "function hasAccess(bytes32 fileHash, address user) external view returns (bool)"
];

// Replace with your actual deployed local or testnet contract address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

/**
 * Connect the user's browser wallet (MetaMask)
 */
export async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask or a Web3 wallet!");
    return null;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

/**
 * Trigger an on-chain file share transaction from the browser
 */
export async function shareFileOnChain(fileHash, receiverAddress) {
  if (!window.ethereum) throw new Error("No crypto wallet found");
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  // Send transaction to the blockchain
  const tx = await contract.shareFile(fileHash, receiverAddress);
  await tx.wait(); // Wait for block confirmation
  return tx.hash;
}