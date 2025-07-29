const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy PriceOracle first
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy(2000); // $2000 initial price
  await priceOracle.waitForDeployment();
  console.log("PriceOracle deployed to:", await priceOracle.getAddress());

  // Deploy FeeManager
  const FeeManager = await hre.ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy();
  await feeManager.waitForDeployment();
  console.log("FeeManager deployed to:", await feeManager.getAddress());

  // Deploy FundingRate
  const FundingRate = await hre.ethers.getContractFactory("FundingRate");
  const fundingRate = await FundingRate.deploy();
  await fundingRate.waitForDeployment();
  console.log("FundingRate deployed to:", await fundingRate.getAddress());

  // Deploy InsuranceFund
  const InsuranceFund = await hre.ethers.getContractFactory("InsuranceFund");
  const insuranceFund = await InsuranceFund.deploy();
  await insuranceFund.waitForDeployment();
  console.log("InsuranceFund deployed to:", await insuranceFund.getAddress());

  // Deploy Governance
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy();
  await governance.waitForDeployment();
  console.log("Governance deployed to:", await governance.getAddress());

  // Deploy Vault first (with deployer as temporary perpManager)
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault deployed to:", vaultAddress);

  // Deploy PerpetualManager with Vault address
  const PerpetualManager = await hre.ethers.getContractFactory("PerpetualManager");
  const perpManager = await PerpetualManager.deploy(vaultAddress);
  await perpManager.waitForDeployment();
  const perpManagerAddress = await perpManager.getAddress();
  console.log("PerpetualManager deployed to:", perpManagerAddress);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("PriceOracle:", await priceOracle.getAddress());
  console.log("FeeManager:", await feeManager.getAddress());
  console.log("FundingRate:", await fundingRate.getAddress());
  console.log("InsuranceFund:", await insuranceFund.getAddress());
  console.log("Governance:", await governance.getAddress());
  console.log("PerpetualManager:", perpManagerAddress);
  console.log("Vault:", vaultAddress);

  // Create deployment info for frontend
  const deploymentInfo = {
    network: "sepolia",
    contracts: {
      PriceOracle: await priceOracle.getAddress(),
      FeeManager: await feeManager.getAddress(),
      FundingRate: await fundingRate.getAddress(),
      InsuranceFund: await insuranceFund.getAddress(),
      Governance: await governance.getAddress(),
      PerpetualManager: perpManagerAddress,
      Vault: vaultAddress
    }
  };

  console.log("\n=== Frontend Integration Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
