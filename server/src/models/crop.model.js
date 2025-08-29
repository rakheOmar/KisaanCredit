import mongoose from "mongoose";

const CropModelSchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  region: { type: String, required: true },
  model: {
    type: { type: String },
    a: Number,
    b: Number,
  },
  source: String,
});

const CropModel = mongoose.model("CropModel", CropModelSchema);

export default CropModel;
