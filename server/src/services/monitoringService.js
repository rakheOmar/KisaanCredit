import { Project } from "../models/project.model.js"; // Correctly imports your existing model
import { NdviData } from "../models/ndviData.model.js"; // The new model we defined
import { getNDVIForPolygon } from "./bhuvanService.js"; // Your existing service
import { ApiError } from "../utils/apiError.js";

export const updateNdviForAllFarms = async () => {
  console.log("Starting NDVI update for all farms...");

  const projects = await Project.find({ "location.geoJson": { $exists: true, $ne: null } });

  if (!projects || projects.length === 0) {
    console.log("No projects with geoJson polygons found to update.");
    return;
  }

  for (const project of projects) {
    try {
    
      const coordinates = project.location.geoJson.coordinates;
      const ndviResult = await getNDVIForPolygon(coordinates);

      if (ndviResult && ndviResult.averageNdvi) {
        await NdviData.create({
          project: project._id,
          date: new Date(),
          ndviValue: ndviResult.averageNdvi,
          imageUrl: ndviResult.imageUrl,
        });

        // CORRECTED LOGGING: Use projectName to match your schema
        console.log(`Successfully updated NDVI for project: ${project.projectName}`);
      }
    } catch (error) {
      // CORRECTED LOGGING: Use projectName
      console.error(`Failed to update NDVI for project ${project.projectName}:`, error);
    }
  }
  console.log("NDVI update job finished.");
};
