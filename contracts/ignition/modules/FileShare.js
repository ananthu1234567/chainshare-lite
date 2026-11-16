
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FileShareModule", (m) => {
  const fileShare = m.contract("FileShare");

  return { fileShare };
});