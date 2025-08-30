import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as GeoTIFF from "geotiff";
import path from "path";
import fs from "fs";
import CropModel from "../models/crop.model.js";
import { getLandCoverFromBhuvan } from "../services/bhuvanService.js";

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

export const createRegion = async (req, res, next) => {
  try {
    const { geojson, centroid } = req.body;
    if (!geojson || !centroid) {
      throw new ApiError("GeoJSON and centroid are required", 400);
    }

    const [lon, lat] = centroid.coordinates;

    const landCoverType = await getLandCoverFromBhuvan(lat, lon);
    const ndviValue = await getNDVIValue(lon, lat);

    console.log(`Looking for model with land cover: "${landCoverType}"`);

    let model = await CropModel.findOne({
      cropName: landCoverType,
      region: "Maharashtra",
    });

    console.log(`Maharashtra model found: ${!!model}`);

    if (!model) {
      model = await CropModel.findOne({
        cropName: landCoverType,
        region: "Generic",
      });
      console.log(`Generic model found: ${!!model}`);
    }

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(`^${landCoverType}$`, "i") },
        region: "Maharashtra",
      });
      console.log(`Case-insensitive Maharashtra model found: ${!!model}`);
    }

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(`^${landCoverType}$`, "i") },
        region: "Generic",
      });
      console.log(`Case-insensitive Generic model found: ${!!model}`);
    }

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(landCoverType, "i") },
        region: "Maharashtra",
      });
      console.log(`Partial Maharashtra model found: ${!!model}`);
    }

    if (!model) {
      model = await CropModel.findOne({
        cropName: { $regex: new RegExp(landCoverType, "i") },
        region: "Generic",
      });
      console.log(`Partial Generic model found: ${!!model}`);
    }

    if (!model) {
      console.log("No model found. Available crop names:");
      const availableCrops = await CropModel.find({}, "cropName region").limit(20);
      availableCrops.forEach((crop) => {
        console.log(`"${crop.cropName}" (${crop.region})`);
      });

      throw new ApiError(
        `No suitable carbon model found for land cover: "${landCoverType}". Available models logged to console.`,
        404
      );
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
        a,
        b,
        usedModel: model.cropName,
        modelRegion: model.region,
      })
    );
  } catch (err) {
    next(err);
  }
};
