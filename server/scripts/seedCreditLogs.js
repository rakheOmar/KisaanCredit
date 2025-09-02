import mongoose from "mongoose";
import { CreditLog } from "../src/models/creditLog.model.js";

const MONGO_URI = "mongodb+srv://Omar:Omar@cluster0.udkuyet.mongodb.net/nabard_1";

const seedCreditLogs = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await CreditLog.deleteMany({});
    console.log("Existing credit logs cleared");

    const issuerWallet = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    const seedData = [
      {
        issuer: issuerWallet,
        recipientUserId: "68b342d9d746eecd96d4d3a9",
        creditAmount: 66,
        pricePerCredit: 514.82,
        creditType: "Renewable Energy",
        reason: "Solar panel installation project",
        description: "Credits for verified renewable energy generation",
        validityMonths: 6,
        issuedAt: new Date("2025-08-15T02:04:19Z"),
        transactionHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 9,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b342d9d746eecd96d4d3a9",
        creditAmount: 22,
        pricePerCredit: 502.99,
        creditType: "Reforestation",
        reason: "Native tree planting initiative",
        description: "Credits for reforestation project in degraded areas",
        validityMonths: 24,
        issuedAt: new Date("2025-08-15T10:10:04Z"),
        transactionHash: "0x2b3c4d5e6f7890ab1cdef234567890abcdef1234567890abcdef1234567890ab",
        blockNumber: 4,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b33940d746eecd96d4d394",
        creditAmount: 17,
        pricePerCredit: 529.86,
        creditType: "Renewable Energy",
        reason: "Wind energy project completion",
        description: "Credits for wind turbine installation and operation",
        validityMonths: 1,
        issuedAt: new Date("2025-08-15T03:38:39Z"),
        transactionHash: "0x3c4d5e6f7890abc2def34567890abcdef1234567890abcdef1234567890abcd",
        blockNumber: 15,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b33940d746eecd96d4d394",
        creditAmount: 47,
        pricePerCredit: 585.26,
        creditType: "Other",
        reason: "Environmental education program",
        description: null,
        validityMonths: 1,
        issuedAt: new Date("2025-08-15T13:26:34Z"),
        transactionHash: "0x4d5e6f7890abcd3ef456789abcdef1234567890abcdef1234567890abcdef12",
        blockNumber: 12,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b342d9d746eecd96d4d3a9",
        creditAmount: 56,
        pricePerCredit: 549.59,
        creditType: "Carbon Sequestration",
        reason: "Wetland restoration project",
        description: "Credits for carbon capture through ecosystem restoration",
        validityMonths: 24,
        issuedAt: new Date("2025-08-15T19:34:13Z"),
        transactionHash: "0x5e6f7890abcdef456789ab4cdef1234567890abcdef1234567890abcdef1234",
        blockNumber: 9,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b335ced746eecd96d4d382",
        creditAmount: 100,
        pricePerCredit: 509.87,
        creditType: "Reforestation",
        reason: "Forest conservation initiative",
        description: "Credits for protecting existing forest areas",
        validityMonths: 12,
        issuedAt: new Date("2025-08-15T15:51:41Z"),
        transactionHash: "0x6f7890abcdef567890ab5def1234567890abcdef1234567890abcdef123456",
        blockNumber: 9,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b342d9d746eecd96d4d3a9",
        creditAmount: 51,
        pricePerCredit: 581.45,
        creditType: "Sustainable Farming",
        reason: "Regenerative agriculture implementation",
        description: null,
        validityMonths: 24,
        issuedAt: new Date("2025-08-15T09:47:08Z"),
        transactionHash: "0x7890abcdef678901ab6def1234567890abcdef1234567890abcdef1234567",
        blockNumber: 6,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b335ced746eecd96d4d382",
        creditAmount: 25,
        pricePerCredit: 585.16,
        creditType: "Sustainable Farming",
        reason: "Organic farming transition",
        description: "Credits for converting to organic farming practices",
        validityMonths: 3,
        issuedAt: new Date("2025-08-15T10:59:38Z"),
        transactionHash: "0x890abcdef789012ab7def1234567890abcdef1234567890abcdef12345678",
        blockNumber: 11,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b335ced746eecd96d4d382",
        creditAmount: 10,
        pricePerCredit: 580.53,
        creditType: "Other",
        reason: "Community environmental workshop",
        description: "Credits for organizing environmental awareness programs",
        validityMonths: 3,
        issuedAt: new Date("2025-08-15T15:17:32Z"),
        transactionHash: "0x90abcdef890123ab8def1234567890abcdef1234567890abcdef123456789",
        blockNumber: 9,
      },
      {
        issuer: issuerWallet,
        recipientUserId: "68b33940d746eecd96d4d394",
        creditAmount: 71,
        pricePerCredit: 543.3,
        creditType: "Reforestation",
        reason: "Urban tree planting campaign",
        description: null,
        validityMonths: 3,
        issuedAt: new Date("2025-08-15T16:36:13Z"),
        transactionHash: "0xa0bcdef901234abc9def1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 7,
      },
    ];

    const createdLogs = await CreditLog.insertMany(seedData);
    console.log(`Successfully seeded ${createdLogs.length} credit logs`);

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding credit logs:", error);
    process.exit(1);
  }
};

seedCreditLogs();
