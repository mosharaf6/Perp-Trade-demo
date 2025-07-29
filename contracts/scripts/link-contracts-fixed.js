const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Linking contracts with:", deployer.address);

  // Contract addresses from latest deployment
  const PERP_MANAGER_ADDRESS = "0xB4FDF413c7eF782a9cd3cAeE647b7A8acE218623";
  const VAULT_ADDRESS = "0xDd73DFb1DAeE4B51572d57256ad137F341E623E4";

  // Get contract instances
  const vault = await hre.ethers.getContractAt("Vault", VAULT_ADDRESS);
  
  console.log("Current perpManager in Vault:", await vault.perpManager());
  console.log("Setting perpManager to PerpetualManager address...");
  
  const tx = await vault.setPerpManager(PERP_MANAGER_ADDRESS);
  await tx.wait();
  console.log("✅ PerpetualManager address updated in Vault");

  // Verify the setup
  const perpFromVault = await vault.perpManager();
  console.log("PerpetualManager address in Vault:", perpFromVault);
  
  const perpManager = await hre.ethers.getContractAt("PerpetualManager", PERP_MANAGER_ADDRESS);
  const vaultFromPerp = await perpManager.vault();
  console.log("Vault address in PerpetualManager:", vaultFromPerp);

  if (vaultFromPerp === VAULT_ADDRESS && perpFromVault === PERP_MANAGER_ADDRESS) {
    console.log("✅ Contract integration is properly configured!");
    console.log("\n=== FINAL CONTRACT ADDRESSES ===");
    console.log("PerpetualManager:", PERP_MANAGER_ADDRESS);
    console.log("Vault:", VAULT_ADDRESS);
    console.log("\n🎉 Ready for frontend integration!");
  } else {
    console.log("❌ Contract integration has issues");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
