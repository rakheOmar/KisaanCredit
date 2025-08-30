import mongoose from "mongoose";
import CropModel from "../src/models/crop.model.js";

const crops = [
  // Built-up areas (minimal carbon sequestration)
  {
    cropName: "Built-Up",
    region: "Generic",
    model: { type: "linear", a: 0.5, b: 0.1 },
    source: "Urban areas with minimal vegetation cover",
  },

  // Major crop categories
  {
    cropName: "Kharif Crop",
    region: "Generic",
    model: { type: "linear", a: 18.5, b: 3.2 },
    source: "Monsoon crops (June-October) including rice, cotton, sugarcane",
  },
  {
    cropName: "Rabi Cropland",
    region: "Generic",
    model: { type: "linear", a: 22.0, b: 4.5 },
    source: "Winter crops (October-March) including wheat, mustard, gram",
  },
  {
    cropName: "Zaid Cropland",
    region: "Generic",
    model: { type: "linear", a: 15.5, b: 2.8 },
    source: "Summer crops (March-June) including watermelon, cucumber, fodder",
  },
  {
    cropName: "Double/Triple/Annual Crop",
    region: "Generic",
    model: { type: "linear", a: 28.5, b: 5.2 },
    source: "Multiple cropping systems with higher biomass production",
  },

  // Fallow lands
  {
    cropName: "Current Fallow",
    region: "Generic",
    model: { type: "linear", a: 8.5, b: 1.5 },
    source: "Temporarily uncultivated land with natural vegetation",
  },

  // Plantation and orchards
  {
    cropName: "Plantation/Orchard",
    region: "Generic",
    model: { type: "linear", a: 32.5, b: 5.7 },
    source: "High-density perennial crops including fruit trees",
  },

  // Forest types
  {
    cropName: "Evergreen Forest",
    region: "Generic",
    model: { type: "linear", a: 45.0, b: 8.5 },
    source: "Dense evergreen forests with high carbon storage",
  },
  {
    cropName: "Deciduous Woodland",
    region: "Generic",
    model: { type: "linear", a: 38.0, b: 6.8 },
    source: "Tropical dry deciduous forests",
  },
  {
    cropName: "Degraded Woodland",
    region: "Generic",
    model: { type: "linear", a: 18.0, b: 3.5 },
    source: "Disturbed forest areas with reduced carbon capacity",
  },

  // Wetlands and water bodies
  {
    cropName: "Littoral/Swamp/Mangroves",
    region: "Generic",
    model: { type: "linear", a: 58.0, b: 12.5 },
    source: "Coastal wetlands with high carbon sequestration",
  },
  {
    cropName: "Grassland",
    region: "Generic",
    model: { type: "linear", a: 12.5, b: 2.3 },
    source: "Natural grasslands and pastures",
  },
  {
    cropName: "Wasteland",
    region: "Generic",
    model: { type: "linear", a: 5.0, b: 0.8 },
    source: "Barren or sparsely vegetated land",
  },
  {
    cropName: "Shifting Cultivation",
    region: "Generic",
    model: { type: "linear", a: 14.0, b: 2.5 },
    source: "Slash and burn agriculture with recovery periods",
  },
  {
    cropName: "Rann",
    region: "Generic",
    model: { type: "linear", a: 2.0, b: 0.3 },
    source: "Salt marshes and seasonal wetlands",
  },
  {
    cropName: "Waterbodies Max Spread",
    region: "Generic",
    model: { type: "linear", a: 0.8, b: 0.15 },
    source: "Maximum extent of water bodies during monsoon",
  },
  {
    cropName: "Waterbodies Min Spread",
    region: "Generic",
    model: { type: "linear", a: 0.5, b: 0.1 },
    source: "Minimum extent of water bodies during dry season",
  },

  // Maharashtra-specific Kharif crops
  {
    cropName: "Rice",
    region: "Maharashtra",
    model: { type: "linear", a: 18.2, b: 3.1 },
    source: "Paddy fields with anaerobic conditions",
  },
  {
    cropName: "Cotton",
    region: "Maharashtra",
    model: { type: "linear", a: 19.8, b: 3.8 },
    source: "Medium-biomass fiber crop",
  },
  {
    cropName: "Sugarcane",
    region: "Maharashtra",
    model: { type: "linear", a: 32.5, b: 5.7 },
    source: "High-biomass perennial crop",
  },
  {
    cropName: "Soybean",
    region: "Maharashtra",
    model: { type: "linear", a: 17.5, b: 3.0 },
    source: "Legume with nitrogen fixation",
  },
  {
    cropName: "Groundnut",
    region: "Maharashtra",
    model: { type: "linear", a: 16.8, b: 2.9 },
    source: "Oilseed legume crop",
  },
  {
    cropName: "Bajra (Pearl Millet)",
    region: "Maharashtra",
    model: { type: "linear", a: 20.5, b: 4.0 },
    source: "Drought-resistant cereal",
  },
  {
    cropName: "Jowar (Sorghum)",
    region: "Maharashtra",
    model: { type: "linear", a: 21.5, b: 4.2 },
    source: "Cereal crop for semi-arid regions",
  },
  {
    cropName: "Maize",
    region: "Maharashtra",
    model: { type: "linear", a: 22.8, b: 4.3 },
    source: "High-yield cereal crop",
  },
  {
    cropName: "Tur (Pigeon Pea)",
    region: "Maharashtra",
    model: { type: "linear", a: 18.5, b: 3.2 },
    source: "Perennial legume pulse crop",
  },

  // Maharashtra-specific Rabi crops
  {
    cropName: "Wheat",
    region: "Maharashtra",
    model: { type: "linear", a: 22.0, b: 4.5 },
    source: "Winter cereal crop",
  },
  {
    cropName: "Gram (Chickpea)",
    region: "Maharashtra",
    model: { type: "linear", a: 16.9, b: 2.9 },
    source: "Nitrogen-fixing pulse crop",
  },
  {
    cropName: "Mustard",
    region: "Maharashtra",
    model: { type: "linear", a: 15.2, b: 2.6 },
    source: "Oilseed crop for winter season",
  },
  {
    cropName: "Onion",
    region: "Maharashtra",
    model: { type: "linear", a: 12.5, b: 2.1 },
    source: "High-value vegetable crop",
  },
  {
    cropName: "Sunflower",
    region: "Maharashtra",
    model: { type: "linear", a: 16.5, b: 2.8 },
    source: "Oilseed crop adaptable to various seasons",
  },

  // Maharashtra-specific Zaid crops
  {
    cropName: "Watermelon",
    region: "Maharashtra",
    model: { type: "linear", a: 14.0, b: 2.4 },
    source: "Summer cucurbit crop",
  },
  {
    cropName: "Muskmelon",
    region: "Maharashtra",
    model: { type: "linear", a: 13.5, b: 2.3 },
    source: "Summer fruit crop",
  },
  {
    cropName: "Cucumber",
    region: "Maharashtra",
    model: { type: "linear", a: 13.0, b: 2.2 },
    source: "Fast-growing vegetable crop",
  },
  {
    cropName: "Fodder Crops",
    region: "Maharashtra",
    model: { type: "linear", a: 16.0, b: 2.7 },
    source: "Various grass and legume species for livestock",
  },

  // Horticultural and plantation crops
  {
    cropName: "Mango",
    region: "Maharashtra",
    model: { type: "linear", a: 35.0, b: 6.2 },
    source: "Perennial fruit tree with high biomass",
  },
  {
    cropName: "Orange",
    region: "Maharashtra",
    model: { type: "linear", a: 30.0, b: 5.5 },
    source: "Citrus plantation crop",
  },
  {
    cropName: "Grapes",
    region: "Maharashtra",
    model: { type: "linear", a: 24.0, b: 4.2 },
    source: "Perennial vine crop",
  },
  {
    cropName: "Pomegranate",
    region: "Maharashtra",
    model: { type: "linear", a: 26.0, b: 4.5 },
    source: "Drought-tolerant fruit tree",
  },
  {
    cropName: "Banana",
    region: "Maharashtra",
    model: { type: "linear", a: 28.0, b: 4.8 },
    source: "High-biomass perennial crop",
  },

  // Agroforestry systems
  {
    cropName: "Poplar-based Agroforestry",
    region: "Generic",
    model: { type: "linear", a: 42.5, b: 10.3 },
    source: "Fast-growing commercial timber with crops",
  },
  {
    cropName: "Eucalyptus-based Agroforestry",
    region: "Generic",
    model: { type: "linear", a: 48.0, b: 12.7 },
    source: "Commercial timber plantation with intercropping",
  },
  {
    cropName: "Teak-based Agroforestry",
    region: "Generic",
    model: { type: "linear", a: 28.0, b: 5.4 },
    source: "High-value timber with agricultural crops",
  },

  // Natural vegetation types
  {
    cropName: "Evergreen Forest",
    region: "Generic",
    model: { type: "linear", a: 55.0, b: 10.5 },
    source: "Dense tropical rainforest",
  },
  {
    cropName: "Tropical Semi-Evergreen Forest",
    region: "Generic",
    model: { type: "linear", a: 48.0, b: 9.0 },
    source: "Mixed evergreen and deciduous forest",
  },
  {
    cropName: "Tropical Moist Deciduous Forest",
    region: "Generic",
    model: { type: "linear", a: 42.0, b: 7.5 },
    source: "Monsoon forest with seasonal leaf fall",
  },
  {
    cropName: "Tropical Dry Deciduous Forest",
    region: "Generic",
    model: { type: "linear", a: 35.0, b: 6.0 },
    source: "Dry forest adapted to low rainfall",
  },
  {
    cropName: "Mangrove Forest",
    region: "Generic",
    model: { type: "linear", a: 65.0, b: 14.0 },
    source: "Coastal wetland forest with high carbon storage",
  },
  {
    cropName: "Temperate Forest",
    region: "Generic",
    model: { type: "linear", a: 40.0, b: 8.0 },
    source: "Mountain forests in cooler regions",
  },

  // Specialized land uses
  {
    cropName: "Tea Plantation",
    region: "Generic",
    model: { type: "linear", a: 28.0, b: 4.8 },
    source: "Perennial beverage crop",
  },
  {
    cropName: "Coffee Plantation",
    region: "Generic",
    model: { type: "linear", a: 30.0, b: 5.2 },
    source: "Shade-grown perennial crop",
  },
  {
    cropName: "Rubber Plantation",
    region: "Generic",
    model: { type: "linear", a: 38.0, b: 7.5 },
    source: "Commercial latex-producing trees",
  },
  {
    cropName: "Bamboo Grove",
    region: "Generic",
    model: { type: "linear", a: 35.0, b: 8.0 },
    source: "Fast-growing grass with high carbon sequestration",
  },
];

mongoose
  .connect("mongodb+srv://Omar:Omar@cluster0.udkuyet.mongodb.net/nabard_1")
  .then(async () => {
    console.log("MongoDB connected successfully");

    try {
      await CropModel.deleteMany({});
      console.log("Existing crop models cleared");

      const result = await CropModel.insertMany(crops);
      console.log(`Successfully inserted ${result.length} crop models`);

      const summary = await CropModel.aggregate([
        {
          $group: {
            _id: "$region",
            count: { $sum: 1 },
            avgA: { $avg: "$model.a" },
            avgB: { $avg: "$model.b" },
          },
        },
      ]);

      console.log("\nSummary by region:");
      summary.forEach((region) => {
        console.log(
          `${region._id}: ${region.count} crops, Avg a=${region.avgA.toFixed(1)}, Avg b=${region.avgB.toFixed(1)}`
        );
      });
    } catch (error) {
      console.error("Error during seeding:", error);
    } finally {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
