const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsuranceFund", function () {
  let fund, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const InsuranceFund = await ethers.getContractFactory("InsuranceFund");
    fund = await InsuranceFund.deploy();
    await fund.waitForDeployment();
  });

  it("Should set the right owner", async function () {
    expect(await fund.owner()).to.equal(owner.address);
  });

  it("Should allow only owner to deposit and cover bad debt", async function () {
    await fund.deposit(1000);
    expect(await fund.getBalance()).to.equal(1000);
    await fund.coverBadDebt(owner.address, 500);
    expect(await fund.getBalance()).to.equal(500);
    await expect(fund.connect(addr1).deposit(100)).to.be.revertedWith("Not owner");
    await expect(fund.connect(addr1).coverBadDebt(owner.address, 100)).to.be.revertedWith("Not owner");
  });

  it("Should not allow covering more than balance", async function () {
    await fund.deposit(100);
    await expect(fund.coverBadDebt(owner.address, 200)).to.be.revertedWith("Insufficient fund");
  });
});
