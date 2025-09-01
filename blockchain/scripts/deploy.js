const hre = require("hardhat");

async function main() {
  console.log("Deploying CreditLedger contract...");

  const CreditLedger = await hre.ethers.getContractFactory("CreditLedger");
  const creditLedger = await CreditLedger.deploy();

  await creditLedger.waitForDeployment();

  const contractAddress = await creditLedger.getAddress();

  console.log(`CreditLedger contract deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
