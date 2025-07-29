const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PerpetualManager", function () {
  let Vault, vault, PerpetualManager, perpManager, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy Vault first with owner as temporary perpManager
    Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(owner.address);
    await vault.waitForDeployment();
    
    // Deploy PerpetualManager with Vault address
    PerpetualManager = await ethers.getContractFactory("PerpetualManager");
    perpManager = await PerpetualManager.deploy(vault.target);
    await perpManager.waitForDeployment();
    
    // Update Vault to use PerpetualManager as authorized caller
    await vault.setPerpManager(perpManager.target);
  });

  it("Should open and close a position", async function () {
    await perpManager.openPosition(addr1.address, true, 1000, 5);
    const pos = await perpManager.getPosition(addr1.address);
    expect(pos.size).to.equal(5000);
    expect(pos.margin).to.equal(1000);
    expect(pos.isLong).to.equal(true);
    await perpManager.closePosition(addr1.address);
    const posAfter = await perpManager.getPosition(addr1.address);
    expect(posAfter.margin).to.equal(0);
  });

  it("Should not allow opening multiple positions for same user", async function () {
    await perpManager.openPosition(addr1.address, true, 1000, 5);
    await expect(perpManager.openPosition(addr1.address, false, 500, 2)).to.be.revertedWith("Position exists");
  });

  it("Should not allow closing non-existent position", async function () {
    await expect(perpManager.closePosition(addr1.address)).to.be.revertedWith("No position");
  });
});
