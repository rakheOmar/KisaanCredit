import mongoose, { Schema } from "mongoose";

const dailyLogSchema = new Schema(
  {
    seasonalLog: {
      type: Schema.Types.ObjectId,
      ref: "SeasonalLog",
      index: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    date: {
      type: Date,
    },
    waterStatus: {
      type: String,
      enum: ["Flooded", "Wet", "Moist", "Dry"],
    },
    image: [{ type: String }],
    fertilizerApplication: {
      fertilizerType: {
        type: String,
        enum: ["Urea", "DAP", "Potash", "Organic Compost", "Other"],
      },
      amount: Number,
    },
  },
  { timestamps: true }
);

export const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
