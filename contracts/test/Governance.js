const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Governance", function () {
  let governance, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy();
    await governance.waitForDeployment();
  });

  it("Should set the right owner", async function () {
    expect(await governance.owner()).to.equal(owner.address);
  });

  it("Should allow only owner to set parameters", async function () {
    const key = ethers.keccak256(ethers.toUtf8Bytes("feeRate"));
    await governance.setParameter(key, 42);
    expect(await governance.getParameter(key)).to.equal(42);
    await expect(governance.connect(addr1).setParameter(key, 100)).to.be.revertedWith("Not owner");
  });
});
