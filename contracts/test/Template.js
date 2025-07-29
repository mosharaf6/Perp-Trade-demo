const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Template", function () {
  it("Should set the right owner and initial value", async function () {
    const [owner] = await ethers.getSigners();
    const Template = await ethers.getContractFactory("Template");
    const template = await Template.deploy(42);
    await template.waitForDeployment();
    expect(await template.owner()).to.equal(owner.address);
    expect(await template.value()).to.equal(42);
  });

  it("Should allow owner to set value", async function () {
    const [owner] = await ethers.getSigners();
    const Template = await ethers.getContractFactory("Template");
    const template = await Template.deploy(1);
    await template.waitForDeployment();
    await template.setValue(100);
    expect(await template.value()).to.equal(100);
  });

  it("Should not allow non-owner to set value", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Template = await ethers.getContractFactory("Template");
    const template = await Template.deploy(1);
    await template.waitForDeployment();
    await expect(template.connect(addr1).setValue(200)).to.be.revertedWith("Only owner can set value");
  });
});
