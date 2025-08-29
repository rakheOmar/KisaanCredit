// seedCrops.js
import mongoose from "mongoose";
import CropModel from "../src/models/crop.model.js";

const crops = [
  {
    cropName: "Kharif Cropland",
    region: "Generic",
    model: { type: "linear", a: 18.5, b: 3.2 },
    source: "Proxy model based on rice/soybean studies.",
  },
  {
    cropName: "Rabi Cropland",
    region: "Generic",
    model: { type: "linear", a: 22.0, b: 4.5 },
    source: "Proxy model based on wheat studies.",
  },
  {
    cropName: "Plantation",
    region: "Generic",
    model: { type: "linear", a: 32.5, b: 5.7 },
    source: "Proxy model based on high-density crops like sugarcane.",
  },
  {
    cropName: "Sugarcane",
    region: "Maharashtra",
    model: { type: "linear", a: 32.5, b: 5.7 },
    source: "High-biomass crop model.",
  },
  {
    cropName: "Cotton",
    region: "Maharashtra",
    model: { type: "linear", a: 19.8, b: 3.8 },
    source: "Medium-biomass crop model.",
  },
  {
    cropName: "Soybean",
    region: "Maharashtra",
    model: { type: "linear", a: 17.5, b: 3.0 },
    source: "Legume-based, lower-biomass model.",
  },
  {
    cropName: "Rice",
    region: "Maharashtra",
    model: { type: "linear", a: 18.2, b: 3.1 },
    source: "Cereal-based model for paddy fields.",
  },
  {
    cropName: "Jowar (Sorghum)",
    region: "Maharashtra",
    model: { type: "linear", a: 21.5, b: 4.2 },
    source: "Cereal-based, similar to wheat.",
  },
  {
    cropName: "Wheat",
    region: "Maharashtra",
    model: { type: "linear", a: 22.0, b: 4.5 },
    source: "Well-studied cereal model.",
  },
  {
    cropName: "Gram (Chickpea)",
    region: "Maharashtra",
    model: { type: "linear", a: 16.9, b: 2.9 },
    source: "Legume-based, similar to soybean.",
  },
  {
    cropName: "Bajra (Pearl Millet)",
    region: "Maharashtra",
    model: { type: "linear", a: 20.5, b: 4.0 },
    source: "Drought-resistant cereal model.",
  },
];

// Removed deprecated options from the connect method
mongoose
  .connect("mongodb+srv://Omar:Omar@cluster0.udkuyet.mongodb.net/nabard_1")
  .then(async () => {
    console.log("MongoDB connected");

    await CropModel.deleteMany({});
    console.log("Existing crop models cleared");

    await CropModel.insertMany(crops);
    console.log("Seed data inserted successfully");

    mongoose.disconnect();
    console.log("MongoDB disconnected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
