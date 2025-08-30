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
  useEffect(() => setMapInstance(map), [map, setMapInstance]);
  return null;
};

export default function EstimateEarningsPage() {
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // Default to India center
  const [drawnGeoJSON, setDrawnGeoJSON] = useState(null);
  const [centroid, setCentroid] = useState(null);
  const [ndvi, setNdvi] = useState(null);
  const [awb, setAwb] = useState(null);
  const [estimatedEarnings, setEstimatedEarnings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          mapInstance?.setView([latitude, longitude], 13);
        },
        () => toast.error("Unable to fetch current location. Defaulting to India.")
      );
    }
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.pm.setGlobalOptions({
      allowSelfIntersection: false,
      templineStyle: { color: "blue" },
      hintlineStyle: { color: "red", dashArray: "5,5" },
    });

    mapInstance.pm.addControls({
      drawPolygon: true,
      drawCircle: false,
      drawMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircleMarker: false,
      cutPolygon: false,
      editMode: true,
      removalMode: true,
      finishOn: "dblclick",
      position: "topright",
    });

    const handleShapeCreated = (e) => {
      const geojson = e.layer.toGeoJSON();
      const centerPoint = turfCentroid(geojson);
      setDrawnGeoJSON(geojson);
      setCentroid(centerPoint.geometry.coordinates);
      toast.success("Boundary captured successfully!");
      mapInstance.pm.disableDraw();
    };

    const handleShapeDeleted = () => {
      setDrawnGeoJSON(null);
      setCentroid(null);
      setNdvi(null);
      setAwb(null);
      setEstimatedEarnings(null);
      mapInstance.pm.enableDraw("Polygon");
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
      if (layers.length > 1) {
        mapInstance.removeLayer(e.layer);
        toast.warn("Only one boundary can be drawn. Delete the existing one first.");
        return;
      }
      handleShapeCreated(e);
    };

    mapInstance.on("pm:create", onCreate);
    mapInstance.on("pm:edit", handleShapeEdited);
    mapInstance.on("pm:remove", handleShapeDeleted);

    return () => {
      if (mapInstance.pm) {
        mapInstance.pm.removeControls();
        mapInstance.off("pm:create", onCreate);
        mapInstance.off("pm:edit", handleShapeEdited);
        mapInstance.off("pm:remove", handleShapeDeleted);
      }
    };
  }, [mapInstance]);

  const handleSubmit = async () => {
    if (!drawnGeoJSON || !centroid) {
      toast.error("Please draw a boundary first.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting boundary data...");
    try {
      const res = await axiosInstance.post("/regions", {
        geojson: drawnGeoJSON,
        centroid: { type: "Point", coordinates: centroid },
      });

      const { ndvi: receivedNdvi = 0, awb: receivedAwb = 0, a = 0, b = 0 } = res.data?.data || {};

      setNdvi(receivedNdvi);
      setAwb(receivedAwb);

      const hectares = turfArea(drawnGeoJSON) / 10000;
      const earnings = (hectares * (receivedNdvi * a + b)).toFixed(2);
      setEstimatedEarnings(earnings);

      toast.success("Boundary submitted and results calculated!", { id: toastId });

      const layers = mapInstance.pm.getGeomanLayers();
      layers.forEach((l) => mapInstance.removeLayer(l));

      handleShapeDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit boundary.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Estimate Earnings from Land</CardTitle>
            <CardDescription>
              Draw your land boundary to get NDVI and estimated earnings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full rounded-md overflow-hidden border">
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                doubleClickZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <DrawingComponent setMapInstance={setMapInstance} />
              </MapContainer>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Polygon Area (ha)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {drawnGeoJSON ? (turfArea(drawnGeoJSON) / 10000).toFixed(2) : "-"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">NDVI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ndvi !== null ? ndvi : "-"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">AWB</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{awb !== null ? awb : "-"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {estimatedEarnings !== null ? `₹${estimatedEarnings}` : "-"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              {drawnGeoJSON && !estimatedEarnings && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Calculating..." : "Calculate Earnings"}
                </Button>
              )}
              {estimatedEarnings !== null && (
                <Button variant="default" onClick={() => navigate("/start-earning")}>
                  Start Earning
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
