import mongoose, { Schema } from "mongoose";

const seasonalLogSchema = new Schema(
  {
    farmer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    carbonProject: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    cropType: {
      type: String,
      required: true,
      trim: true,
    },
    cropVariety: {
      type: String,
      trim: true,
    },
    plantingDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const SeasonalLog = mongoose.model("SeasonalLog", seasonalLogSchema);
