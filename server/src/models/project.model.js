import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    projectName: {
      type: String,
      required: [true, "Project name is required."],
      trim: true,
      index: true,
    },
    projectDeveloper: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectType: {
      type: String,
      required: true,
      enum: ["Agroforestry", "Rice Cultivation Methane Reduction", "Mixed"],
    },
    location: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      geoJson: {
        type: {
          type: String,
          enum: ["Polygon"],
        },
        coordinates: {
          type: [[[Number]]],
        },
      },
    },
    carbonStandard: {
      type: String,
      trim: true,
      default: "N/A",
    },
    methodology: {
      type: String,
      trim: true,
      required: [true, "Methodology is required."],
    },
    creditingPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    status: {
      type: String,
      enum: ["Planning", "Registration", "Active", "Verification", "Completed"],
      default: "Planning",
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verifier: {
      name: { type: String },
      accreditation: { type: String },
    },
    documentation: [
      {
        docName: { type: String },
        docUrl: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model("Project", projectSchema);
