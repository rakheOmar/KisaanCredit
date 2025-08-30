import axios from "axios";

export const getLandCoverFromBhuvan = async (lat, lon) => {
  try {
    const url = `https://bhuvan-app1.nrsc.gov.in/api/lulc250k/curl_lulc250k_point.php?lon=${lon}&lat=${lat}&year=2018_19&token=780632e7fbb0a60e6fb9e867ee6d185aeaa79d72`;

    const response = await axios.get(url);
    const data = response.data;

    console.log("Bhuvan land cover data:", data);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Bhuvan response is empty or not an array");
    }

    let landCoverType = data[0]?.Description;
    if (!landCoverType) {
      throw new Error("Failed to parse land cover type from Bhuvan response");
    }

    console.log(`Original Description: "${landCoverType}"`);
    console.log(`Original length: ${landCoverType.length}`);

    landCoverType = landCoverType.replace(/\s+/g, " ").trim();

    console.log(`Cleaned Description: "${landCoverType}"`);
    console.log(`Cleaned length: ${landCoverType.length}`);

    return landCoverType;
  } catch (error) {
    console.error("Error fetching land cover data:", error);
    throw error;
  }
};
