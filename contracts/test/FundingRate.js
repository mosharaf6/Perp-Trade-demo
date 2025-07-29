const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundingRate", function () {
  let fundingRate, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const FundingRate = await ethers.getContractFactory("FundingRate");
    fundingRate = await FundingRate.deploy();
    await fundingRate.waitForDeployment();
  });

  it("Should set the right owner", async function () {
    expect(await fundingRate.owner()).to.equal(owner.address);
  });

  it("Should allow only owner to update funding", async function () {
    await fundingRate.updateFunding();
    expect(await fundingRate.fundingPayments(owner.address)).to.equal(1);
    await expect(fundingRate.connect(addr1).updateFunding()).to.be.revertedWith("Not owner");
  });

  it("Should return correct funding payment for user", async function () {
    await fundingRate.updateFunding();
    expect(await fundingRate.getFundingPayment(owner.address)).to.equal(1);
    expect(await fundingRate.getFundingPayment(addr1.address)).to.equal(0);
  });
});
