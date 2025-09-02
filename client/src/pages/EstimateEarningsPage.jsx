import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { centroid as turfCentroid, area as turfArea } from "@turf/turf";
import { toast, Toaster } from "sonner";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  LandPlot,
  BarChart,
  Coins,
  MapPin,
  Zap,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from "lucide-react";

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
      const res = await axiosInstance.post("/regions", {
        geojson: drawnGeoJSON,
        centroid: { type: "Point", coordinates: centroid },
      });
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

  const handleStartEarning = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!drawnGeoJSON || !areaHectares) {
      toast.error("Please analyze the land first.");
      return;
    }
    const toastId = toast.loading("Submitting land plot data...");
    try {
      await axiosInstance.put("/farmers/land-plot", {
        geoJson: drawnGeoJSON.geometry,
        areaInHectares: parseFloat(areaHectares),
      });
      toast.success("Land plot submitted successfully!", { id: toastId });
      navigate("/");
    } catch (error) {
      console.error("Error submitting land plot:", error);
      toast.error("Failed to submit land plot. Please try again.", { id: toastId });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Carbon Estimator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Use satellite analysis to calculate carbon credits and estimate earnings from your
              land.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <div className="h-[500px] md:h-[600px] w-full rounded-lg overflow-hidden border shadow-inner">
                <MapContainer
                  center={userLocation}
                  zoom={13}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                  className="rounded-lg"
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community"
                  />
                  <DrawingComponent setMapInstance={setMapInstance} />
                </MapContainer>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoBlock
                  title="Area (Hectares)"
                  data={areaHectares}
                  placeholder="0.00"
                  icon={LandPlot}
                />
                <InfoBlock
                  title="NDVI Index"
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

              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button variant="outline" onClick={resetAll} disabled={isSubmitting}>
                  Reset Boundary
                </Button>
                {drawnGeoJSON && !analysisComplete && (
                  <Button onClick={handleAnalyze} disabled={isSubmitting} size="lg">
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? "Analyzing..." : "Analyze Land"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {analysisComplete && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <MapPin className="w-6 h-6 mr-3 text-primary" />
                    Land Cover Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Detected Land Cover</h4>
                    <Badge variant="secondary" className="text-base py-1 px-3">
                      {landCoverType || "N/A"}
                    </Badge>
                  </div>
                  {detectedCropsData.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Matching Crops</h4>
                      <div className="flex flex-wrap gap-2">
                        {detectedCropsData.map((crop, index) => (
                          <Badge key={index} variant="outline">
                            {crop.crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {detectedCropsData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <TrendingUp className="w-6 h-6 mr-3 text-primary" />
                      Detailed Crop Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {detectedCropsData.map((crop, index) => (
                      <div key={index} className="p-4 bg-muted rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm items-center">
                          <div className="flex items-center font-medium">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                            Crop:
                            <span className="ml-2 font-normal text-muted-foreground">
                              {crop.crop}
                            </span>
                          </div>
                          <div className="flex items-center font-medium">
                            <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                            Region:
                            <span className="ml-2 font-normal text-muted-foreground">
                              {crop.region}
                            </span>
                          </div>
                          <div className="flex items-center font-medium">
                            <BarChart className="w-4 h-4 text-purple-500 mr-2" />
                            AWB:
                            <span className="ml-2 font-normal text-muted-foreground">
                              {crop.awb?.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Coins className="w-8 h-8 mr-3" />
                    Summary & Next Steps
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80 text-base">
                    Based on our analysis, here is your potential for carbon credits and earnings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleStartEarning}
                      size="lg"
                      className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold py-6 text-base"
                    >
                      <Coins className="w-5 h-5 mr-2" />
                      Start Earning Now
                    </Button>
                    <Button
                      onClick={() => toast.info("This feature will be available soon.")}
                      size="lg"
                      variant="secondary"
                      className="flex-1 font-semibold py-6 text-base"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Submit for Verification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
