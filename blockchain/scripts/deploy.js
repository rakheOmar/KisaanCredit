async function main() {
  const PaymentLogger = await ethers.getContractFactory("PaymentLogger");
  const paymentLogger = await PaymentLogger.deploy();
  await paymentLogger.waitForDeployment();

  console.log(
    "PaymentLogger contract deployed to:",
    await paymentLogger.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
