const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting up contract links with:", deployer.address);

  // Contract addresses from deployment
  const PERP_MANAGER_ADDRESS = "0xc7cc98251208Dc47e06C534198974c3362C27bE9";
  const VAULT_ADDRESS = "0x2052D6455a8482ae8642F0403C026aB46d5C82B2";

  // Get contract instances
  const perpManager = await hre.ethers.getContractAt("PerpetualManager", PERP_MANAGER_ADDRESS);
  
  console.log("Setting vault address in PerpetualManager...");
  const tx = await perpManager.setVault(VAULT_ADDRESS);
  await tx.wait();
  console.log("✅ Vault address updated in PerpetualManager");

  // Verify the setup
  const vaultFromPerp = await perpManager.vault();
  console.log("Vault address in PerpetualManager:", vaultFromPerp);
  
  const vault = await hre.ethers.getContractAt("Vault", VAULT_ADDRESS);
  const perpFromVault = await vault.perpManager();
  console.log("PerpetualManager address in Vault:", perpFromVault);

  if (vaultFromPerp === VAULT_ADDRESS && perpFromVault === PERP_MANAGER_ADDRESS) {
    console.log("✅ Contract integration is properly configured!");
  } else {
    console.log("❌ Contract integration has issues");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
