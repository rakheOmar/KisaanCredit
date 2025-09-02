import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import https from "https";

export const getLandCoverFromBhuvan = async (lon, lat) => {
  try {
    const url = `https://bhuvan-app1.nrsc.gov.in/api/lulc250k/curl_lulc250k_point.php?lon=${lon}&lat=${lat}&year=2018_19&token=061d882a35c00e55903b94c7bc004e4fe7634b44`;

    console.log("Fetching Bhuvan API:", url);

    const response = await axios.get(url, {
      timeout: 60000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
      validateStatus: (status) => status >= 200 && status < 500,
    });

    const data = response.data;
    console.log("Bhuvan raw response:", data);

    if (!data) throw new Error("Empty response from Bhuvan");
    if (typeof data === "string") throw new Error("Bhuvan returned HTML/string response");
    if (!Array.isArray(data) || data.length === 0) throw new Error("Invalid Bhuvan array response");

    let landCoverType = data[0]?.Description;
    if (!landCoverType) throw new Error("Land cover description missing");

    landCoverType = landCoverType.replace(/\s+/g, " ").trim();
    console.log(`Cleaned land cover: "${landCoverType}"`);

    return landCoverType;
  } catch (error) {
    console.error("Error fetching land cover from Bhuvan:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received from Bhuvan API");
    }

    console.warn("Falling back to default land cover: Agriculture");
    return "Agriculture";
  }
};

// let accessToken = null;
// let refreshToken = null;
// let tokenExpiry = null;

// const API_BASE_URL = "https://bhoonidhi-api.nrsc.gov.in";

// // -------------------- AUTH --------------------
// const authenticate = async () => {
//   console.log("Authenticating with Bhoonidhi...");
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/token`, {
//       userId: process.env.BHOONIDHI_USER_ID,
//       password: process.env.BHOONIDHI_PASSWORD,
//       grant_type: "password",
//     });

//     const data = response.data;
//     accessToken = data.access_token;
//     refreshToken = data.refresh_token;
//     tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // buffer 1 min

//     console.log("Bhoonidhi authentication successful.");
//   } catch (error) {
//     console.error(
//       "Bhoonidhi Authentication Failed:",
//       error.response ? error.response.data : error.message
//     );
//     throw new Error("Could not authenticate with Bhoonidhi API.");
//   }
// };

// const refreshAccessToken = async () => {
//   console.log("Refreshing Bhoonidhi access token...");
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/token`, {
//       grant_type: "refresh_token",
//       refresh_token: refreshToken,
//     });

//     const data = response.data;
//     accessToken = data.access_token;
//     refreshToken = data.refresh_token; // refresh may rotate
//     tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

//     console.log("Bhoonidhi token refreshed.");
//   } catch (error) {
//     console.error(
//       "Token refresh failed, falling back to full authentication:",
//       error.response ? error.response.data : error.message
//     );
//     await authenticate();
//   }
// };

// const getValidAccessToken = async () => {
//   if (!accessToken) {
//     await authenticate();
//   } else if (Date.now() > tokenExpiry) {
//     await refreshAccessToken();
//   }
//   return accessToken;
// };

// export const logoutBhoonidhi = async () => {
//   if (!refreshToken) return;

//   try {
//     await axios.post(
//       `${API_BASE_URL}/auth/logout`,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${refreshToken}`,
//         },
//       }
//     );
//     console.log("Logged out from Bhoonidhi.");
//     accessToken = null;
//     refreshToken = null;
//     tokenExpiry = null;
//   } catch (error) {
//     console.error("Logout failed:", error.response ? error.response.data : error.message);
//   }
// };

// // -------------------- LAND COVER --------------------
// export const getLandCoverFromBhuvan = async (lat, lon) => {
//   try {
//     // get a valid token (instead of hardcoded token=xxxx)
//     const token = await getValidAccessToken();
//     const url = `https://bhuvan-app1.nrsc.gov.in/api/lulc250k/curl_lulc250k_point.php?lon=${lon}&lat=${lat}&year=2018_19&token=${token}`;

//     const response = await axios.get(url);
//     const data = response.data;

//     if (!Array.isArray(data) || data.length === 0) {
//       throw new Error("Bhuvan response is empty or not an array");
//     }

//     let landCoverType = data[0]?.Description;
//     if (!landCoverType) {
//       throw new Error("Failed to parse land cover type from Bhuvan response");
//     }

//     landCoverType = landCoverType.replace(/\s+/g, " ").trim();
//     return landCoverType;
//   } catch (error) {
//     console.error("Error fetching land cover data:", error);
//     throw error;
//   }
// };

// // -------------------- NDVI FETCH --------------------
// export const getNDVIForPolygon = async (polygonCoordinates) => {
//   try {
//     const token = await getValidAccessToken();
//     console.log("Searching Bhoonidhi for NDVI data with a valid token...");

//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//     const datetimeRange = `${thirtyDaysAgo.toISOString()}/${new Date().toISOString()}`;

//     const searchPayload = {
//       collections: ["EOS-06_OCM-LAC_L2C-NDVI", "EOS-06_OCM-GAC_L2C-NDVI"],
//       datetime: datetimeRange,
//       intersects: {
//         type: "Polygon",
//         coordinates: polygonCoordinates,
//       },
//       filter: {
//         args: [{ property: "Online" }, "Y"],
//         op: "eq",
//       },
//       "filter-lang": "cql2-json",
//       limit: 10,
//     };

//     const searchResponse = await axios.post(`${API_BASE_URL}/data/search`, searchPayload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const searchResults = searchResponse.data;

//     if (!searchResults.features || searchResults.features.length === 0) {
//       console.log("No products found in the last 30 days.");
//       return {
//         averageNdvi: 0,
//         imageUrl: null,
//         metadata: { status: "No products found" },
//       };
//     }

//     // pick product with least cloud cover
//     const bestFeature = searchResults.features.sort((a, b) => {
//       const cloudA = a.properties?.cloud_cover || 100;
//       const cloudB = b.properties?.cloud_cover || 100;
//       return cloudA - cloudB;
//     })[0];

//     const properties = bestFeature.properties;
//     console.log(`Found best product: ${bestFeature.id} from ${properties.datetime}`);

//     // Fake NDVI calculation based on cloud cover (replace with actual raster calc later)
//     const cloudCover = properties.cloud_cover || 0;
//     const cloudEffect = (100 - cloudCover) / 100;
//     const simulatedNdvi = 0.2 + 0.6 * cloudEffect;

//     const __dirname = path.dirname(fileURLToPath(import.meta.url));
//     const mockImageUrl = path.resolve(__dirname, "../../data/dec_colorized.tif");

//     return {
//       averageNdvi: simulatedNdvi,
//       imageUrl: mockImageUrl,
//       metadata: {
//         productId: bestFeature.id,
//         collection: bestFeature.collection,
//         date: properties.datetime,
//         cloudCover: cloudCover,
//       },
//     };
//   } catch (error) {
//     console.error(
//       "Error during Bhoonidhi data search:",
//       error.response ? error.response.data : error.message
//     );
//     return {
//       averageNdvi: 0,
//       imageUrl: null,
//       metadata: { status: "Error during API call" },
//     };
//   }
// };
