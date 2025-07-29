const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FeeManager", function () {
  let feeManager, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const FeeManager = await ethers.getContractFactory("FeeManager");
    feeManager = await FeeManager.deploy();
    await feeManager.waitForDeployment();
  });

  it("Should set the right owner", async function () {
    expect(await feeManager.owner()).to.equal(owner.address);
  });

  it("Should allow only owner to collect fees", async function () {
    await feeManager.collectFee(owner.address, 100);
    expect(await feeManager.getCollectedFees()).to.equal(100);
    await expect(feeManager.connect(addr1).collectFee(addr1.address, 50)).to.be.revertedWith("Not owner");
  });
});
