import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { centroid as turfCentroid, area as turfArea } from "@turf/turf";
import { toast, Toaster } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const DrawingComponent = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);
  return null;
};

export default function EstimateEarningsPage() {
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // India center
  const [drawnGeoJSON, setDrawnGeoJSON] = useState(null);
  const [centroid, setCentroid] = useState(null);
  const [ndvi, setNdvi] = useState(null);
  const [awb, setAwb] = useState(null);
  const [estimatedEarnings, setEstimatedEarnings] = useState(null);
  const [carbonCredits, setCarbonCredits] = useState(null);
  const [carbonEmission, setCarbonEmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landCoverType, setLandCoverType] = useState(null);
  const [detectedCrops, setDetectedCrops] = useState([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          mapInstance?.setView(coords, 13);
        },
        () => toast.error("Unable to fetch current location.")
      );
    }
  }, [mapInstance]);

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

    const handleShapeCreated = (e) => {
      const geojson = e.layer.toGeoJSON();
      const centerPoint = turfCentroid(geojson);
      setDrawnGeoJSON(geojson);
      setCentroid(centerPoint.geometry.coordinates);

      // Auto fit bounds
      const bounds = L.geoJSON(geojson).getBounds();
      mapInstance.fitBounds(bounds, { padding: [20, 20] });

      toast.success("Boundary captured successfully!");
    };

    const handleShapeDeleted = () => {
      setDrawnGeoJSON(null);
      setCentroid(null);
      setNdvi(null);
      setAwb(null);
      setEstimatedEarnings(null);
      setCarbonCredits(null);
      setCarbonEmission(null);
      setLandCoverType(null);
      setDetectedCrops([]);
      setAnalysisComplete(false);
    };

    const handleShapeEdited = (e) => {
      const geojson = e.layer.toGeoJSON();
      const centerPoint = turfCentroid(geojson);
      setDrawnGeoJSON(geojson);
      setCentroid(centerPoint.geometry.coordinates);
      toast.info("Boundary updated.");
    };

    const onCreate = (e) => {
      const layers = mapInstance.pm.getGeomanLayers();
      if (layers.length > 0) {
        const existingLayer = layers.find((l) => l !== e.layer);
        if (existingLayer) {
          mapInstance.removeLayer(e.layer);
          toast.warn("Only one boundary can be drawn. Delete existing first.");
          return;
        }
      }
      handleShapeCreated(e);
      mapInstance.pm.disableDraw("Polygon");
    };

    const onRemove = () => {
      handleShapeDeleted();
      mapInstance.pm.enableDraw("Polygon");
    };

    mapInstance.on("pm:create", onCreate);
    mapInstance.on("pm:edit", handleShapeEdited);
    mapInstance.on("pm:remove", onRemove);

    return () => {
      if (mapInstance.pm) mapInstance.pm.removeControls();
      mapInstance.off("pm:create", onCreate);
      mapInstance.off("pm:edit", handleShapeEdited);
      mapInstance.off("pm:remove", onRemove);
    };
  }, [mapInstance]);

  const handleSubmit = async () => {
    if (!drawnGeoJSON || !centroid) {
      toast.error("Please draw a boundary first.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Analyzing crop data...");

    try {
      const res = await axiosInstance.post("/regions", {
        geojson: drawnGeoJSON,
        centroid: { type: "Point", coordinates: centroid },
      });

      console.log("🔍 Full API Response:", res.data);

      const responseData = res.data.data || {};
      const { ndvi: receivedNdvi, landCoverType: landCover, detectedCrops = [] } = responseData;

      console.log("📊 Extracted data:", { receivedNdvi, landCover, detectedCrops });

      // Set basic data
      setNdvi(receivedNdvi);
      setLandCoverType(landCover);

      // Calculate area in hectares
      const hectares = turfArea(drawnGeoJSON) / 10000;

      if (detectedCrops && detectedCrops.length > 0) {
        // Use first crop for calculations
        const firstCrop = detectedCrops[0];
        const { awb: awbValue, a = 1, b = 0 } = firstCrop;

        setAwb(awbValue);
        setDetectedCrops(detectedCrops);

        // Calculate carbon emission (tCO2)
        const carbonEm = (awbValue * a).toFixed(2);
        setCarbonEmission(carbonEm);

        // Calculate carbon credits (10% of emission, scaled by area)
        const creditsPerHectare = parseFloat(carbonEm) * 0.1;
        const totalCredits = (creditsPerHectare * hectares).toFixed(2);
        setCarbonCredits(totalCredits);

        // Calculate estimated earnings (credits * price per credit)
        const pricePerCredit = 50; // ₹50 per credit (adjust as needed)
        const earnings = (parseFloat(totalCredits) * pricePerCredit).toFixed(2);
        setEstimatedEarnings(earnings);

        console.log("✅ Calculations:", {
          hectares: hectares.toFixed(2),
          carbonEm,
          totalCredits,
          earnings,
        });
      } else {
        // No crops detected - use default calculation
        setAwb(null);
        setDetectedCrops([]);

        // Basic calculation without crop-specific data
        const basicCredits = (hectares * receivedNdvi * 0.5).toFixed(2); // Basic formula
        setCarbonCredits(basicCredits);

        const basicEarnings = (parseFloat(basicCredits) * 30).toFixed(2); // Lower rate for non-crop
        setEstimatedEarnings(basicEarnings);
      }

      setAnalysisComplete(true);
      toast.success("Analysis complete!", { id: toastId });
    } catch (err) {
      console.error("❌ Analysis error:", err);
      toast.error(err.response?.data?.message || "Failed to analyze.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCarbonCreditsSubmit = () => {
    if (!user) {
      // Store current analysis data in sessionStorage before redirecting
      const analysisData = {
        area: drawnGeoJSON ? (turfArea(drawnGeoJSON) / 10000).toFixed(2) : null,
        ndvi,
        awb,
        carbonCredits,
        carbonEmission,
        estimatedEarnings,
        landCoverType,
        detectedCrops,
      };

      sessionStorage.setItem("pendingCarbonCredits", JSON.stringify(analysisData));
      toast.info("Please login to submit carbon credits");
      navigate("/login");
      return;
    }

    toast.success("Carbon credits submitted successfully!");
    // Add your carbon credits processing logic here
    navigate("/dashboard"); // or wherever you want to redirect after submission
  };

  const resetBoundary = () => {
    const layers = mapInstance?.pm.getGeomanLayers() || [];
    layers.forEach((l) => mapInstance.removeLayer(l));

    setDrawnGeoJSON(null);
    setCentroid(null);
    setNdvi(null);
    setAwb(null);
    setEstimatedEarnings(null);
    setCarbonCredits(null);
    setCarbonEmission(null);
    setLandCoverType(null);
    setDetectedCrops([]);
    setAnalysisComplete(false);

    mapInstance?.pm.enableDraw("Polygon");
    toast.info("Boundary reset.");
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const areaHectares = drawnGeoJSON ? (turfArea(drawnGeoJSON) / 10000).toFixed(2) : null;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Carbon Credits & Earnings Estimator</CardTitle>
            <CardDescription>
              Draw your land boundary to analyze crops, calculate carbon credits, and estimate
              potential earnings.
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <DrawingComponent setMapInstance={setMapInstance} />
              </MapContainer>
            </div>

            {/* Analysis Results */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Area (ha)</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-lg font-bold">{areaHectares || "-"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">NDVI</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-lg font-bold">{ndvi !== null ? ndvi.toFixed(3) : "-"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Carbon Emission (tCO₂)</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-lg font-bold">{carbonEmission || "-"}</div>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-sm text-green-700 dark:text-green-300">
                    Carbon Credits
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-lg font-bold text-green-600">{carbonCredits || "-"}</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-sm text-blue-700 dark:text-blue-300">
                    Estimated Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-lg font-bold text-blue-600">
                    {estimatedEarnings ? `₹${estimatedEarnings}` : "-"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Land Cover Information */}
            {landCoverType && (
              <div className="mt-6">
                <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                  <CardHeader>
                    <CardTitle className="text-orange-800 dark:text-orange-200">
                      🌍 Land Cover Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <strong>Detected Land Cover:</strong> {landCoverType}
                    </div>
                    {detectedCrops.length > 0 && (
                      <div className="mt-2 text-sm">
                        <strong>Matching Crops:</strong>{" "}
                        {detectedCrops.map((crop) => crop.crop).join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Crop Information */}
            {detectedCrops.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">🌾 Detailed Crop Analysis</h3>
                <div className="space-y-3">
                  {detectedCrops.map((crop, index) => (
                    <Card key={index} className="border-green-200 dark:border-green-800">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <strong>Crop:</strong> {crop.crop}
                          </div>
                          <div>
                            <strong>Region:</strong> {crop.region}
                          </div>
                          <div>
                            <strong>AWB:</strong> {crop.awb?.toFixed(3)}
                          </div>
                          <div>
                            <strong>Model:</strong> a={crop.a}, b={crop.b}
                          </div>
                        </div>
                        {crop.matchType && (
                          <div className="mt-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                crop.matchType === "exact"
                                  ? "bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200"
                                  : "bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200"
                              }`}
                            >
                              {crop.matchType} match
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No crops detected message */}
            {analysisComplete && detectedCrops.length === 0 && landCoverType && (
              <div className="mt-6">
                <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
                  <CardContent className="pt-4">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      No Specific Crop Models Found
                    </div>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      Land cover "{landCoverType}" detected, but no matching crop models in
                      database. Basic carbon credits calculated using general vegetation parameters.
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Carbon Credits Summary Card */}
            {analysisComplete && carbonCredits && (
              <div className="mt-6">
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200">
                      💰 Carbon Credits Summary
                    </CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                      Your potential carbon credits and earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{areaHectares}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Hectares</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {carbonEmission || carbonCredits}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {carbonEmission ? "tCO₂ Emission" : "Credits"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{carbonCredits}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Carbon Credits
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">₹{estimatedEarnings}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Potential Earnings
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-4">
                      <h4 className="font-semibold mb-2">Calculation Details:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Area: {areaHectares} hectares</li>
                        <li>• NDVI: {ndvi?.toFixed(3)} (vegetation health)</li>
                        {awb && <li>• AWB: {awb.toFixed(3)} (above-ground biomass)</li>}
                        <li>
                          • Credits rate: {detectedCrops.length > 0 ? "₹50" : "₹30"} per credit
                        </li>
                        <li>• Land type: {landCoverType}</li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleCarbonCreditsSubmit}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      🌱 Submit for Carbon Credits Registration
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between gap-4">
              <Button variant="outline" onClick={resetBoundary} disabled={isSubmitting}>
                Reset Boundary
              </Button>

              <div className="flex gap-2">
                {drawnGeoJSON && !analysisComplete && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Analyzing..." : "Analyze Land"}
                  </Button>
                )}

                {analysisComplete && estimatedEarnings && (
                  <Button
                    onClick={() => navigate("/start-earning")}
                    variant="default"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Start Earning Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
