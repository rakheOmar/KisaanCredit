import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import CropModel from "../models/crop.model.js";
import { getLandCoverFromBhuvan, getNDVIForPolygon } from "../services/bhuvanService.js";

export const createRegion = async (req, res, next) => {
  try {
    const { geojson, centroid } = req.body;
    if (!geojson || !centroid) {
      throw new ApiError("GeoJSON and centroid are required", 400);
    }

    const [lon, lat] = centroid.coordinates;

    let landCoverType;
    try {
      landCoverType = await getLandCoverFromBhuvan(lat, lon);
    } catch (bhuvanError) {
      console.error(
        "Bhuvan LULC service failed. Defaulting to 'Generic'. Error:",
        bhuvanError.message
      );
      landCoverType = "Generic";
    }

    let ndviData;
    let ndviValue;
    try {
      ndviData = await getNDVIForPolygon(geojson.coordinates);
      if (ndviData.averageNdvi === 0 && ndviData.metadata.status) {
        console.error(
          "Bhoonidhi service returned an error state. Defaulting NDVI. Status:",
          ndviData.metadata.status
        );
        ndviValue = 0.4; // Default NDVI for moderate vegetation
        ndviData.metadata.status = "Using fallback NDVI due to API error.";
      } else {
        ndviValue = ndviData.averageNdvi;
      }
    } catch (ndviError) {
      console.error(
        "Bhoonidhi service failed completely (e.g., timeout). Defaulting NDVI. Error:",
        ndviError.message
      );
      ndviValue = 0.4; // Default NDVI for moderate vegetation
      ndviData = { metadata: { status: "Using fallback NDVI due to network failure." } };
    }

    let model = await CropModel.findOne({
      cropName: { $regex: new RegExp(`^${landCoverType}$`, "i") },
      region: "Maharashtra",
    });

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(`^${landCoverType}$`, "i") },
        region: "Generic",
      });
    }

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(landCoverType, "i") },
        region: "Maharashtra",
      });
    }

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(landCoverType, "i") },
        region: "Generic",
      });
    }

    if (!model) {
      throw new ApiError(`No suitable carbon model found for land cover: "${landCoverType}".`, 404);
    }

    const { a, b } = model.model;
    const awbValue = a * ndviValue - b;

    return res.status(201).json(
      new ApiResponse(201, "Region processed successfully", {
        geojson,
        centroid,
        landCoverType,
        ndvi: ndviValue,
        awb: awbValue,
        modelParameters: { a, b },
        usedModel: {
          cropName: model.cropName,
          region: model.region,
        },
        satelliteMetadata: ndviData.metadata,
      })
    );
  } catch (err) {
    next(err);
  }
};
