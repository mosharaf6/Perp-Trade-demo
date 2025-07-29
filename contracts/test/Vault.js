const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let Vault, vault, owner, perpManager, addr1;

  beforeEach(async function () {
    [owner, perpManager, addr1] = await ethers.getSigners();
    Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(perpManager.address);
    await vault.waitForDeployment();
  });

  it("Should set the right PerpetualManager", async function () {
    expect(await vault.perpManager()).to.equal(perpManager.address);
  });

  it("Should allow only PerpetualManager to deposit and withdraw", async function () {
    await vault.connect(perpManager).deposit(addr1.address, 1000);
    expect(await vault.getCollateral(addr1.address)).to.equal(1000);
    await vault.connect(perpManager).withdraw(addr1.address, 500);
    expect(await vault.getCollateral(addr1.address)).to.equal(500);
    await expect(vault.deposit(addr1.address, 100)).to.be.revertedWith("Not authorized");
    await expect(vault.withdraw(addr1.address, 100)).to.be.revertedWith("Not authorized");
  });

  it("Should not allow withdrawing more than collateral", async function () {
    await vault.connect(perpManager).deposit(addr1.address, 100);
    await expect(vault.connect(perpManager).withdraw(addr1.address, 200)).to.be.revertedWith("Insufficient collateral");
  });

  it("Should allow only PerpetualManager to liquidate", async function () {
    await vault.connect(perpManager).deposit(addr1.address, 100);
    await vault.connect(perpManager).liquidate(addr1.address);
    expect(await vault.getCollateral(addr1.address)).to.equal(0);
    await expect(vault.liquidate(addr1.address)).to.be.revertedWith("Not authorized");
  });
});
