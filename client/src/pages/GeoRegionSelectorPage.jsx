import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { centroid as turfCentroid, area as turfArea } from "@turf/turf";
import { toast, Toaster } from "sonner";
import { Navigate } from "react-router-dom";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const DrawingComponent = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => setMapInstance(map), [map, setMapInstance]);
  return null;
};

const GeoRegionSelectorPage = () => {
  const [drawnGeoJSON, setDrawnGeoJSON] = useState(null);
  const [centroid, setCentroid] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // India center
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisData, setAnalysisData] = useState({ ndvi: null, awb: null });
  const [areaHectares, setAreaHectares] = useState(null);
  const [carbonEstimate, setCarbonEstimate] = useState(null);
  const [carbonCredits, setCarbonCredits] = useState(null);
  const [cropsDetected, setCropsDetected] = useState([]);
  const [landCoverType, setLandCoverType] = useState(null);
  const [detectedCropsData, setDetectedCropsData] = useState([]); // Store full crop data
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const { user, loading } = useAuth();

  // Locate user
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        mapInstance?.setView(coords, 13);
      },
      () => toast.error("Unable to fetch current location.")
    );
  }, [mapInstance]);

  // Shape handler
  const updateShapeData = useCallback(
    (layer) => {
      const geojson = layer.toGeoJSON();
      const centerPoint = turfCentroid(geojson);
      setDrawnGeoJSON(geojson);
      setCentroid(centerPoint.geometry.coordinates);

      // Area ha
      const areaSqM = turfArea(geojson);
      setAreaHectares((areaSqM / 10000).toFixed(2));

      // Auto fit
      const bounds = L.geoJSON(geojson).getBounds();
      mapInstance.fitBounds(bounds, { padding: [20, 20] });
    },
    [mapInstance]
  );

  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.pm.addControls({
      position: "topright",
      drawCircle: false,
      drawPolygon: true,
      drawMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircleMarker: false,
      cutPolygon: false,
    });
    mapInstance.pm.setGlobalOptions({ limitMarkersToCount: 1 });

    const handleCreate = (e) => {
      const layers = mapInstance.pm.getGeomanLayers();
      if (layers.length > 1) {
        mapInstance.removeLayer(e.layer);
        toast.warn("Only one boundary allowed. Delete the existing one first.");
        return;
      }
      updateShapeData(e.layer);
      toast.success("Boundary captured!");
      mapInstance.pm.disableDraw("Polygon");
    };

    const handleEdit = (e) => {
      updateShapeData(e.layer);
      toast.info("Boundary updated.");
    };

    const handleRemove = () => {
      resetShape();
      toast.info("Boundary removed.");
    };

    mapInstance.on("pm:create", handleCreate);
    mapInstance.on("pm:edit", handleEdit);
    mapInstance.on("pm:remove", handleRemove);

    return () => {
      mapInstance.pm?.removeControls();
      mapInstance.off("pm:create", handleCreate);
      mapInstance.off("pm:edit", handleEdit);
      mapInstance.off("pm:remove", handleRemove);
    };
  }, [mapInstance, updateShapeData]);

  const resetShape = () => {
    setDrawnGeoJSON(null);
    setCentroid(null);
    setAnalysisData({ ndvi: null, awb: null });
    setAreaHectares(null);
    setCarbonEstimate(null);
    setCarbonCredits(null);
    setCropsDetected([]);
    setLandCoverType(null);
    setDetectedCropsData([]);
    setAnalysisComplete(false);
    mapInstance?.pm.enableDraw("Polygon");
  };

  // Handle carbon credits submission
  const handleCarbonCreditsSubmit = () => {
    if (!user) {
      // Redirect to login/register if not authenticated
      window.location.href = "/login"; // or use navigate if you have react-router
      return;
    }

    // If user is authenticated, you can process the carbon credits
    toast.success("Carbon credits submitted successfully!");
    // Add your carbon credits processing logic here
    // For example, save to database, generate certificate, etc.
  };
  const handleSubmit = async () => {
    if (!drawnGeoJSON || !centroid) {
      toast.error("Please draw a boundary first.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Analyzing...");

    try {
      const res = await axiosInstance.post("/regions", {
        geojson: drawnGeoJSON,
        centroid: { type: "Point", coordinates: centroid },
      });

      console.log("🔍 Full API Response:", res.data); // Debug log

      // Extract data from the response
      const responseData = res.data.data || {};
      const { ndvi, landCoverType: landCover, detectedCrops = [] } = responseData;

      console.log("📊 Extracted data:", { ndvi, landCover, detectedCrops }); // Debug log
      console.log("📊 State before update:", {
        currentCropsDetected: cropsDetected,
        currentLandCoverType: landCoverType,
        currentNDVI: analysisData.ndvi,
      });

      // Set land cover type
      setLandCoverType(landCover);

      // Set NDVI
      setAnalysisData((prev) => ({ ...prev, ndvi: ndvi ?? null }));

      // Process detected crops
      if (detectedCrops && detectedCrops.length > 0) {
        // Store full crop data
        setDetectedCropsData(detectedCrops);

        // Extract crop names for display
        const cropNames = detectedCrops.map((crop) => crop.crop);
        setCropsDetected(cropNames);

        // Use the first crop's AWB value for display (or you could average them)
        const firstCrop = detectedCrops[0];
        const awbValue = firstCrop.awb;
        setAnalysisData((prev) => ({ ...prev, awb: awbValue }));

        // Calculate carbon estimate using the first crop's AWB and coefficients
        if (awbValue && firstCrop.a) {
          const carbonEst = (awbValue * firstCrop.a).toFixed(2);
          setCarbonEstimate(carbonEst);

          // Calculate carbon credits (assuming 1 tCO2 = 1 credit, with area scaling)
          const areaInHa = parseFloat(areaHectares) || 1;
          const creditsPerHectare = parseFloat(carbonEst) * 0.1; // 10% of carbon as credits
          const totalCredits = (creditsPerHectare * areaInHa).toFixed(2);
          setCarbonCredits(totalCredits);
        }

        console.log("✅ Processed crops:", cropNames);
        console.log("📈 AWB value:", awbValue);
      } else {
        // No crops detected
        console.log("❌ No crops detected");
        setCropsDetected([]);
        setDetectedCropsData([]);
        setAnalysisData((prev) => ({ ...prev, awb: null }));
        setCarbonEstimate(null);
        setCarbonCredits(null);

        // Show land cover type even if no specific crops detected
        if (landCover) {
          toast.info(`Land cover detected: ${landCover}, but no specific crop models found.`);
        }
      }

      console.log("📊 State after update:", {
        newCropsDetected: cropsDetected.length > 0 ? cropsDetected : "empty",
        newLandCoverType: landCover,
        newNDVI: ndvi,
      });

      toast.success("Analysis complete!", { id: toastId });
      setAnalysisComplete(true);

      // Don't reset the shape immediately - let user see the results
      // mapInstance.pm.getGeomanLayers().forEach((l) => mapInstance.removeLayer(l));
      // resetShape();
    } catch (error) {
      console.error("❌ Analysis error:", error);
      toast.error(error.response?.data?.message || "Failed to analyze.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Crop Carbon Analysis</CardTitle>
            <CardDescription>
              Draw farm boundary and estimate NDVI, AWB & Carbon. Crops will be detected
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full rounded-md overflow-hidden border">
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <DrawingComponent setMapInstance={setMapInstance} />
              </MapContainer>
            </div>

            {/* Results */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <InfoBlock title="Area (ha)" data={areaHectares} placeholder="Draw boundary..." />
              <InfoBlock
                title="Centroid (lat, lon)"
                data={centroid ? `${centroid[1].toFixed(4)}, ${centroid[0].toFixed(4)}` : null}
                placeholder="Draw boundary..."
              />
              <InfoBlock
                title="NDVI & AWB"
                data={
                  analysisData.ndvi !== null
                    ? `NDVI: ${analysisData.ndvi?.toFixed(3)}, AWB: ${analysisData.awb?.toFixed(3) || "N/A"}`
                    : null
                }
                placeholder="Submit for analysis..."
              />
              <InfoBlock
                title="Carbon Emission (tCO₂)"
                data={carbonEstimate}
                placeholder="Submit for analysis..."
              />
              <InfoBlock
                title="Carbon Credits"
                data={carbonCredits ? `${carbonCredits} credits` : null}
                placeholder="Submit for analysis..."
                highlight={true}
              />
            </div>

            {/* Land Cover Type */}
            {landCoverType && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Land Cover Type:</h3>
                <div className="p-4 rounded-md bg-blue-100 dark:bg-blue-800 text-sm">
                  {landCoverType}
                </div>
              </div>
            )}

            {/* Detected Crops */}
            {cropsDetected.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Crops Detected:</h3>
                <div className="space-y-2">
                  {detectedCropsData.map((crop, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-md bg-green-100 dark:bg-green-800 text-sm"
                    >
                      <div className="font-medium">{crop.crop}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Region: {crop.region} | AWB: {crop.awb?.toFixed(3)} | Model: a={crop.a}, b=
                        {crop.b}
                        {crop.matchType && (
                          <span className="ml-2 px-2 py-1 bg-blue-200 dark:bg-blue-700 rounded text-xs">
                            {crop.matchType} match
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show message when no crops detected but land cover is available */}
            {cropsDetected.length === 0 && landCoverType && analysisData.ndvi !== null && (
              <div className="mt-6">
                <div className="p-4 rounded-md bg-yellow-100 dark:bg-yellow-800 text-sm">
                  <div className="font-medium">No Matching Crop Models Found</div>
                  <div className="mt-2">
                    Land cover detected: <strong>"{landCoverType}"</strong>
                    <br />
                    NDVI: <strong>{analysisData.ndvi}</strong>
                    <br />
                    <span className="text-xs mt-1 block">
                      This land cover type doesn't match any crop models in the database. Consider
                      adding crop models for this land cover type.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Carbon Credits Summary */}
            {analysisComplete && carbonCredits && (
              <div className="mt-6">
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200">
                      🌱 Carbon Credits Calculation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{areaHectares}</div>
                        <div className="text-sm text-gray-600">Hectares</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{carbonEstimate}</div>
                        <div className="text-sm text-gray-600">tCO₂ Emission</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{carbonCredits}</div>
                        <div className="text-sm text-gray-600">Carbon Credits</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      Carbon credits calculated based on{" "}
                      {detectedCropsData.length > 0 ? detectedCropsData[0].crop : "detected crop"}
                      analysis for {areaHectares} hectares of {landCoverType}.
                    </div>
                    <Button
                      onClick={handleCarbonCreditsSubmit}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      Submit for Carbon Credits Registration
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={resetShape}>
                Reset Boundary
              </Button>
              <Button onClick={handleSubmit} disabled={!drawnGeoJSON || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Analyze Crop"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const InfoBlock = ({ title, data, placeholder, highlight = false }) => (
  <div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <div
      className={`p-4 rounded-md text-sm h-20 flex items-center ${
        highlight
          ? "bg-green-100 dark:bg-green-800 border-2 border-green-300 dark:border-green-600"
          : "bg-slate-100 dark:bg-slate-800"
      }`}
    >
      {data || placeholder}
    </div>
  </div>
);

export default GeoRegionSelectorPage;
