import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { centroid as turfCentroid, area as turfArea } from "@turf/turf";
import { toast, Toaster } from "sonner";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, LandPlot, BarChart, Coins } from "lucide-react";

const useAuth = () => ({
  user: { id: 1, name: "Demo User", token: "YOUR_AUTH_TOKEN" },
  loading: false,
});

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

const InfoBlock = ({ title, data, placeholder, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{data || placeholder}</div>
    </CardContent>
  </Card>
);

export default function UnifiedCarbonEstimator() {
  const navigate = useNavigate();
  const [drawnGeoJSON, setDrawnGeoJSON] = useState(null);
  const [centroid, setCentroid] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisData, setAnalysisData] = useState({ ndvi: null, awb: null });
  const [areaHectares, setAreaHectares] = useState(null);
  const [carbonEmission, setCarbonEmission] = useState(null);
  const [carbonCredits, setCarbonCredits] = useState(null);
  const [estimatedEarnings, setEstimatedEarnings] = useState(null);
  const [landCoverType, setLandCoverType] = useState(null);
  const [detectedCropsData, setDetectedCropsData] = useState([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const { user, loading } = useAuth();

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

  const updateShapeData = useCallback(
    (layer) => {
      const geojson = layer.toGeoJSON();
      const centerPoint = turfCentroid(geojson);
      setDrawnGeoJSON(geojson);
      setCentroid(centerPoint.geometry.coordinates);

      const areaSqM = turfArea(geojson);
      setAreaHectares((areaSqM / 10000).toFixed(2));

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

    const handleCreate = (e) => {
      const layers = mapInstance.pm.getGeomanLayers();
      if (layers.length > 1) {
        mapInstance.removeLayer(e.layer);
        toast.warn("Only one boundary is allowed. Please delete the existing one first.");
        return;
      }
      updateShapeData(e.layer);
      toast.success("Boundary captured successfully!");
      mapInstance.pm.disableDraw("Polygon");
    };

    const handleEdit = (e) => {
      updateShapeData(e.layer);
      toast.info("Boundary updated.");
    };

    const handleRemove = () => {
      resetAll();
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

  const resetAll = () => {
    setDrawnGeoJSON(null);
    setCentroid(null);
    setAnalysisData({ ndvi: null, awb: null });
    setAreaHectares(null);
    setCarbonEmission(null);
    setCarbonCredits(null);
    setEstimatedEarnings(null);
    setLandCoverType(null);
    setDetectedCropsData([]);
    setAnalysisComplete(false);
    mapInstance?.pm.getGeomanLayers().forEach((layer) => mapInstance.removeLayer(layer));
    mapInstance?.pm.enableDraw("Polygon");
  };

  const handleAnalyze = async () => {
    if (!drawnGeoJSON || !centroid) {
      toast.error("Please draw a boundary first.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Analyzing your land data...");

    try {
      const res = await axiosInstance.post(
        "/regions",
        {
          geojson: drawnGeoJSON,
          centroid: { type: "Point", coordinates: centroid },
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const responseData = res.data.data || {};
      setAnalysisData({
        ndvi: responseData.ndvi,
        awb: responseData.awb,
      });
      setLandCoverType(responseData.landCoverType);
      setDetectedCropsData(responseData.detectedCrops || []);

      const hectares = parseFloat(areaHectares);

      if (responseData.detectedCrops?.length > 0) {
        const firstCrop = responseData.detectedCrops[0];
        const { awb: awbValue } = firstCrop;
        const carbonEm = (awbValue * hectares * 0.45).toFixed(2);
        setCarbonEmission(carbonEm);
        const totalCredits = (parseFloat(carbonEm) * 0.1).toFixed(2);
        setCarbonCredits(totalCredits);
        const earnings = (parseFloat(totalCredits) * 650).toFixed(2);
        setEstimatedEarnings(earnings);
      } else {
        const basicEmission = (hectares * responseData.ndvi * 5).toFixed(2);
        setCarbonEmission(basicEmission);
        const basicCredits = (parseFloat(basicEmission) * 0.05).toFixed(2);
        setCarbonCredits(basicCredits);
        const basicEarnings = (parseFloat(basicCredits) * 400).toFixed(2);
        setEstimatedEarnings(basicEarnings);
      }

      setAnalysisComplete(true);
      toast.success("Analysis complete!", { id: toastId });
    } catch (error) {
      console.error("Backend error:", error.response?.data || error.message);
      toast.error("Failed to analyze land. Please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEarning = () => {
    if (!user) {
      navigate("/register");
    } else {
      toast.info("Redirecting to your dashboard...");
    }
  };

  if (loading)
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Carbon Estimator</CardTitle>
            <CardDescription>
              Draw your land boundary to analyze crops, calculate carbon credits, and estimate
              potential earnings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full rounded-lg overflow-hidden border shadow-inner">
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

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoBlock title="Area (ha)" data={areaHectares} placeholder="0.00" icon={LandPlot} />
              <InfoBlock
                title="NDVI"
                data={analysisData.ndvi !== null ? analysisData.ndvi.toFixed(3) : null}
                placeholder="N/A"
                icon={BarChart}
              />
              <InfoBlock
                title="Carbon Credits"
                data={carbonCredits}
                placeholder="0.00"
                icon={Leaf}
              />
              <InfoBlock
                title="Est. Earnings (INR)"
                data={estimatedEarnings ? `₹${estimatedEarnings}` : null}
                placeholder="₹0.00"
                icon={Coins}
              />
            </div>

            {analysisComplete && (
              <div className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🌍 Land Cover Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Detected Land Cover:</strong> {landCoverType || "N/A"}
                    </p>
                    {detectedCropsData.length > 0 && (
                      <p className="mt-2">
                        <strong>Matching Crops:</strong>{" "}
                        {detectedCropsData.map((crop) => crop.crop).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {detectedCropsData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">🌾 Detailed Crop Analysis</h3>
                    <div className="space-y-3">
                      {detectedCropsData.map((crop, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm items-center">
                              <div>
                                <strong>Crop:</strong> {crop.crop}
                              </div>
                              <div>
                                <strong>Region:</strong> {crop.region}
                              </div>
                              <div>
                                <strong>AWB:</strong> {crop.awb?.toFixed(3)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>💰 Summary & Next Steps</CardTitle>
                    <CardDescription>
                      Based on our analysis, here is your potential for carbon credits and earnings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button onClick={handleStartEarning} size="lg" className="flex-1">
                        Start Earning Now
                      </Button>
                      <Button
                        onClick={() => toast.info("This feature will be available soon.")}
                        size="lg"
                        variant="secondary"
                        className="flex-1"
                      >
                        Submit for Verification
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-6 flex justify-between gap-4">
              <Button variant="outline" onClick={resetAll} disabled={isSubmitting}>
                Reset Boundary
              </Button>
              {drawnGeoJSON && !analysisComplete && (
                <Button onClick={handleAnalyze} disabled={isSubmitting}>
                  {isSubmitting ? "Analyzing..." : "Analyze Land"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
