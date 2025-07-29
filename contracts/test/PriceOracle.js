const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceOracle", function () {
  let oracle, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy(1234);
    await oracle.waitForDeployment();
  });

  it("Should set the right owner and initial price", async function () {
    expect(await oracle.owner()).to.equal(owner.address);
    expect(await oracle.getPrice()).to.equal(1234);
  });

  it("Should allow only owner to set price", async function () {
    await oracle.setPrice(4321);
    expect(await oracle.getPrice()).to.equal(4321);
    await expect(oracle.connect(addr1).setPrice(1111)).to.be.revertedWith("Not owner");
  });
});
