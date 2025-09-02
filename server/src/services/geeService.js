// services/geeService.js
import ee from "@google/earthengine";

class GEEService {
  async getSoilHealthData(latitude, longitude, date, radius = 1000) {
    const point = ee.Geometry.Point([longitude, latitude]);
    const buffer = point.buffer(radius);

    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 3);

    try {
      const uploadedAsset = ee.Image("projects/sodium-port-470610-p6/assets/out");

      const smap = ee
        .ImageCollection("NASA_USDA/HSL/SMAP_soil_moisture")
        .filterDate(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0])
        .select("ssm")
        .mean();

      const soc = ee.Image("OpenLandMap/SOL/SOL_ORGANIC-CARBON_USDA-6A1C_M/v02").select("b0");

      const ph = ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02").select("b0");

      const ndvi = ee
        .ImageCollection("MODIS/061/MOD13Q1")
        .filterDate(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0])
        .select("NDVI")
        .mean()
        .multiply(0.0001);

      const elevation = ee.Image("USGS/SRTMGL1_003");

      const results = await Promise.all([
        this.extractValue(uploadedAsset, buffer),
        this.extractValue(smap, buffer),
        this.extractValue(soc, buffer),
        this.extractValue(ph, buffer),
        this.extractValue(ndvi, buffer),
        this.extractValue(elevation, buffer),
      ]);

      return {
        uploadedData: results[0],
        soilMoisture: results[1].ssm || 0,
        organicCarbon: results[2].b0 || 0,
        soilPH: results[3].b0 || 0,
        ndvi: results[4].NDVI || 0,
        elevation: results[5].elevation || 0,
        location: { latitude, longitude },
        date: date,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`GEE fetch failed: ${error.message}`);
    }
  }

  extractValue(image, geometry) {
    return new Promise((resolve, reject) => {
      image
        .reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: geometry,
          scale: 250,
          maxPixels: 1e9,
        })
        .evaluate((result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
    });
  }
}

export default new GEEService();
