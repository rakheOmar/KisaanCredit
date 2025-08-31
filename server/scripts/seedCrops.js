import mongoose from "mongoose";
import { DailyLog } from "../src/models/dailyLog.model.js";

// MongoDB connection URI
const MONGO_URI = "mongodb+srv://Omar:Omar@cluster0.udkuyet.mongodb.net/nabard_1";

// Farmer ObjectId
const FARMER_ID = "68b342d9d746eecd96d4d3a9";

// Possible water statuses and fertilizer types
const waterStatuses = ["Flooded", "Wet", "Moist", "Dry"];
const fertilizerTypes = ["Urea", "DAP", "Potash", "Organic Compost", "Other"];

// Helper function to pick random element
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDailyLogs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const today = new Date();
    const logs = [];

    for (let i = 90; i >= 1; i--) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - i);

      const dailyLog = {
        farmerId: new mongoose.Types.ObjectId(FARMER_ID), // <--- fixed
        date: logDate,
        waterStatus: getRandomElement(waterStatuses),
        image: [
          `http://res.cloudinary.com/dbiuz4lm0/image/upload/v1756656378/d1yt5ctdooldx2vvifjc.jpg`,
        ],
        fertilizerApplication: {
          fertilizerType: getRandomElement(fertilizerTypes),
          amount: Math.floor(Math.random() * 20) + 1,
        },
      };

      logs.push(dailyLog);
    }

    await DailyLog.insertMany(logs);
    console.log("Seeded 90 daily logs successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding daily logs:", error);
    process.exit(1);
  }
}

seedDailyLogs();
