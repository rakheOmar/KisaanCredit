import mongoose, { Schema } from "mongoose";

const dailyLogSchema = new Schema(
  {
    seasonalLog: {
      type: Schema.Types.ObjectId,
      ref: "SeasonalLog",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    waterStatus: {
      type: String,
      enum: ["Flooded", "Wet", "Moist", "Dry"],
    },
    activityNotes: {
      type: String,
      trim: true,
    },
    fertilizerApplication: {
      type: {
        type: String,
        enum: ["Urea", "DAP", "Potash", "Organic Compost", "Other"],
      },
      amount: Number,
    },
    treesPlanted: {
      species: String,
      numberOfTrees: Number,
    },
  },
  { timestamps: true }
);

export const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
