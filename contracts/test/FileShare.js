import { expect } from "chai";
import { network } from "hardhat";

describe("FileShare", function () {
  const HASH = "0x" + "11".repeat(32);

  async function setup() {
    const { ethers } = await network.create();
    const [alice, bob, carol] = await ethers.getSigners();
    const FileShareFactory = await ethers.getContractFactory("FileShare");
    const fs = await FileShareFactory.deploy();
    await fs.waitForDeployment();
    return { fs, alice, bob, carol };
  }

  it("shares a file: receiver and sender have access, a stranger does not", async function () {
    const { fs, alice, bob, carol } = await setup();
    await expect(fs.connect(alice).shareFile(HASH, bob.address))
      .to.emit(fs, "FileShared");

    expect(await fs.hasAccess(HASH, bob.address)).to.equal(true);
    expect(await fs.hasAccess(HASH, alice.address)).to.equal(true);
    expect(await fs.hasAccess(HASH, carol.address)).to.equal(false);
  });

  it("rejects sharing the same hash twice", async function () {
    const { fs, alice, bob } = await setup();
    await fs.connect(alice).shareFile(HASH, bob.address);
    await expect(fs.connect(alice).shareFile(HASH, bob.address))
      .to.be.revertedWithCustomError(fs, "AlreadyShared");
  });

  it("revoke removes the receiver's access but not the sender's", async function () {
    const { fs, alice, bob } = await setup();
    await fs.connect(alice).shareFile(HASH, bob.address);
    await fs.connect(alice).revokeFile(HASH);

    expect(await fs.hasAccess(HASH, bob.address)).to.equal(false);
    expect(await fs.hasAccess(HASH, alice.address)).to.equal(true);
  });
});