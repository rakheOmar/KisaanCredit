import axios from "axios";

// Axios client without default Content-Type header
const apiClient = axios.create({
  baseURL: "https://bhoonidhi-api.nrsc.gov.in",
});

export default async function searchDataForPolygon(polygonCoordinates) {
  const userId = "Tejas1233";
  const password = "Tejas@1233";

  const loginBody = new URLSearchParams();
  loginBody.append("userId", userId);
  loginBody.append("password", password);
  loginBody.append("grant_type", "password");

  let accessToken;
  try {
    const tokenResponse = await apiClient.post("/auth/token", loginBody, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      throw new Error("Login response did not contain an access token.");
    }
  } catch (error) {
    const errorMessage = error.response
      ? `API Error during login: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `Network Error during login: ${error.message}`;
    throw new Error(errorMessage);
  }

  const searchBody = {
    collections: ["EOS-06_OCM-LAC_L2C-NDVI"],
    intersects: {
      type: "Polygon",
      coordinates: polygonCoordinates,
    },
    limit: 500,
  };

  try {
    const response = await apiClient.post("/data/search", searchBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response
      ? `API Error during data search: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `Network Error during data search: ${error.message}`;
    throw new Error(errorMessage);
  }
}
