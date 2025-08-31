import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import * as GeoTIFF from "geotiff";
import path from "path";
import fs from "fs";
import CropModel from "../models/crop.model.js";
import { getLandCoverFromBhuvan } from "../services/bhuvanService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const tifPath = path.join(process.cwd(), "data", "dec.tif");

const getNDVIValue = async (lon, lat) => {
  if (!fs.existsSync(tifPath)) {
    throw new ApiError("NDVI raster file not found on server", 500);
  }

  const fileBuffer = fs.readFileSync(tifPath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();

  const fileDirectory = image.getFileDirectory();
  const noDataValue = fileDirectory.GDAL_NODATA ? parseFloat(fileDirectory.GDAL_NODATA) : null;
  const sampleFormat = fileDirectory.SampleFormat ? fileDirectory.SampleFormat[0] : 1;

  const width = image.getWidth();
  const height = image.getHeight();
  const bbox = image.getBoundingBox();
  const rasters = await image.readRasters({ interleave: true });

  const xRes = (bbox[2] - bbox[0]) / width;
  const yRes = (bbox[3] - bbox[1]) / height;

  const xPixel = Math.floor((lon - bbox[0]) / xRes);
  const yPixel = Math.floor((bbox[3] - lat) / yRes);

  if (xPixel < 0 || yPixel < 0 || xPixel >= width || yPixel >= height) {
    throw new ApiError("Centroid is out of the raster's bounds", 400);
  }

  const pixelValue = rasters[yPixel * width + xPixel];

  if (noDataValue !== null && pixelValue === noDataValue) {
    throw new ApiError("Coordinates point to an area with no data", 400);
  }

  let ndvi = pixelValue / 200.0;

  if (sampleFormat === 3) {
    ndvi = pixelValue;
  }

  console.log(`Raw pixel value: ${pixelValue}, Computed NDVI: ${ndvi}`);
  return ndvi;
};

const mapLandCoverToCrops = (landCover) => {
  const mappings = {
    "Degraded/Scrub Forest": ["agroforestry", "mixed", "scrub", "forest", "degraded"],
    "Dense Forest": ["agroforestry", "forest"],
    "Open Forest": ["agroforestry", "mixed", "forest"],
    "Agricultural Land": ["rice", "wheat", "cotton", "sugarcane", "maize", "crop"],
    "Crop Land": ["rice", "wheat", "cotton", "sugarcane", "maize", "crop"],
    "Irrigated Land": ["rice", "wheat", "cotton", "sugarcane"],
    Grassland: ["grass", "pasture", "fodder"],
    Wasteland: ["mixed", "degraded"],
    default: ["crop", "agriculture", "mixed"],
  };

  return mappings[landCover] || mappings["default"];
};

export const createRegion = asyncHandler(async (req, res) => {
  const { geojson, centroid } = req.body;
  if (!geojson || !centroid) {
    throw new ApiError("GeoJSON and centroid are required", 400);
  }

  const [lon, lat] = centroid.coordinates;

  let landCoverType;
  try {
    landCoverType = await getLandCoverFromBhuvan(lon, lat);
    console.log(`Land cover from Bhuvan: "${landCoverType}"`);
  } catch (err) {
    console.error("Failed to fetch from Bhuvan:", err.message);
    throw new ApiError("Failed to fetch land cover from Bhuvan API", 502);
  }

  const ndviValue = await getNDVIValue(lon, lat);

  let matchingCrops = [];

  matchingCrops = await CropModel.find({
    cropName: { $regex: new RegExp(landCoverType, "i") },
  });

  if (matchingCrops.length === 0) {
    const possibleCropKeywords = mapLandCoverToCrops(landCoverType);
    console.log(`Searching for crops with keywords: ${possibleCropKeywords.join(", ")}`);

    const regexPatterns = possibleCropKeywords.map((keyword) => new RegExp(keyword, "i"));

    matchingCrops = await CropModel.find({
      $or: regexPatterns.map((pattern) => ({ cropName: { $regex: pattern } })),
    });
  }

  if (matchingCrops.length === 0) {
    console.log("No specific matches found, using default crops...");
    matchingCrops = await CropModel.find({}).limit(3);
  }

  if (matchingCrops.length === 0) {
    console.log("No crops found. Available crops in database:");
    const availableCrops = await CropModel.find({}, "cropName region").limit(20);
    availableCrops.forEach((crop) => console.log(`- "${crop.cropName}" (${crop.region})`));
  }

  const results = [];
  for (const model of matchingCrops) {
    const { a, b } = model.model;
    const awbValue = a * ndviValue - b;

    results.push({
      crop: model.cropName,
      region: model.region,
      a,
      b,
      awb: awbValue,
      matchType: model.cropName.toLowerCase().includes(landCoverType.toLowerCase())
        ? "exact"
        : "approximate",
    });
  }

  console.log(`Found ${results.length} matching crops for land cover "${landCoverType}"`);
  results.forEach((r) => console.log(`  - ${r.crop}: AWB=${r.awb.toFixed(3)}`));

  return res.status(201).json(
    new ApiResponse(201, "Region processed successfully", {
      geojson,
      centroid,
      landCoverType,
      ndvi: ndviValue,
      detectedCrops: results,
      searchInfo: {
        exactMatches: results.filter((r) => r.matchType === "exact").length,
        approximateMatches: results.filter((r) => r.matchType === "approximate").length,
      },
    })
  );
});

// export const createRegion = async (req, res, next) => {
//   try {
//     const { geojson, centroid } = req.body;
//     if (!geojson || !centroid) {
//       throw new ApiError("GeoJSON and centroid are required", 400);
//     }

//     const [lon, lat] = centroid.coordinates;

//     let landCoverType;
//     try {
//       landCoverType = await getLandCoverFromBhuvan(lat, lon);
//     } catch (bhuvanError) {
//       console.error(
//         "Bhuvan LULC service failed. Defaulting to 'Generic'. Error:",
//         bhuvanError.message
//       );
//       landCoverType = "Generic";
//     }

//     let ndviData;
//     let ndviValue;
//     try {
//       ndviData = await getNDVIForPolygon(geojson.coordinates);
//       if (ndviData.averageNdvi === 0 && ndviData.metadata.status) {
//         console.error(
//           "Bhoonidhi service returned an error state. Defaulting NDVI. Status:",
//           ndviData.metadata.status
//         );
//         ndviValue = 0.4; // Default NDVI for moderate vegetation
//         ndviData.metadata.status = "Using fallback NDVI due to API error.";
//       } else {
//         ndviValue = ndviData.averageNdvi;
//       }
//     } catch (ndviError) {
//       console.error(
//         "Bhoonidhi service failed completely (e.g., timeout). Defaulting NDVI. Error:",
//         ndviError.message
//       );
//       ndviValue = 0.4; // Default NDVI for moderate vegetation
//       ndviData = { metadata: { status: "Using fallback NDVI due to network failure." } };
//     }

//     let model = await CropModel.findOne({
//       cropName: { $regex: new RegExp(`^${landCoverType}$`, "i") },
//       region: "Maharashtra",
//     });

//     if (!model) {
//       model = await CropModel.findOne({
//         cropName: { $regex: new RegExp(`^${landCoverType}$`, "i") },
//         region: "Generic",
//       });
//     }

//     if (!model) {
//       model = await CropModel.findOne({
//         cropName: { $regex: new RegExp(landCoverType, "i") },
//         region: "Maharashtra",
//       });
//     }

//     if (!model) {
//       model = await CropModel.findOne({
//         cropName: { $regex: new RegExp(landCoverType, "i") },
//         region: "Generic",
//       });
//     }

//     if (!model) {
//       throw new ApiError(`No suitable carbon model found for land cover: "${landCoverType}".`, 404);
//     }

//     const { a, b } = model.model;
//     const awbValue = a * ndviValue - b;

//     return res.status(201).json(
//       new ApiResponse(201, "Region processed successfully", {
//         geojson,
//         centroid,
//         landCoverType,
//         ndvi: ndviValue,
//         awb: awbValue,
//         modelParameters: { a, b },
//         usedModel: {
//           cropName: model.cropName,
//           region: model.region,
//         },
//         satelliteMetadata: ndviData.metadata,
//       })
//     );
//   } catch (err) {
//     next(err);
//   }
// };

export const getNdviDataForPolygon = asyncHandler(async (req, res) => {
  let geojson = req.body.geojson;

  if (!geojson) {
    throw new ApiError("A valid GeoJSON object is required in the request body", 400);
  }

  // If geojson has a 'geometry' property, use it
  if (geojson.geometry) {
    geojson = geojson.geometry;
  }

  if (geojson.type !== "Polygon" || !geojson.coordinates) {
    throw new ApiError("A valid GeoJSON Polygon is required", 400);
  }

  const searchResults = await searchDataForPolygon(geojson.coordinates);

  if (!searchResults || !searchResults.features) {
    throw new ApiError(
      "Failed to retrieve NDVI data or no data was found for the given polygon.",
      404
    );
  }

  res.status(200).json(
    new ApiResponse(200, "NDVI data products retrieved successfully", {
      context: searchResults.context,
      features: searchResults.features,
      links: searchResults.links,
    })
  );
});
