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
  const [userLocation, setUserLocation] = useState([51.505, -0.09]);
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
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          mapInstance?.setView([pos.coords.latitude, pos.coords.longitude], 13);
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
      toast.success("Boundary captured successfully!");
    };

    const handleShapeDeleted = () => {
      setDrawnGeoJSON(null);
      setCentroid(null);
      setNdvi(null);
      setAwb(null);
      setEstimatedEarnings(null);
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
    const toastId = toast.loading("Submitting boundary data...");
    try {
      const res = await axiosInstance.post("/regions", {
        geojson: drawnGeoJSON,
        centroid: { type: "Point", coordinates: centroid },
      });
      const res1 = await axiosInstance.post("/regions/ndvi", {
        geojson: drawnGeoJSON,
      });
      console.log(res1);

      const receivedNdvi = res.data?.data?.ndvi || 0;
      const receivedAwb = res.data?.data?.awb || 0;
      const a = res.data?.data?.a || 0;
      const b = res.data?.data?.b || 0;

      setNdvi(receivedNdvi);
      setAwb(receivedAwb);

      const hectares = turfArea(drawnGeoJSON) / 10000;
      const earnings = (hectares * (receivedNdvi * a + b)).toFixed(2);
      setEstimatedEarnings(earnings);

      toast.success("Boundary submitted and NDVI received!", { id: toastId });

      const layers = mapInstance.pm.getGeomanLayers();
      layers.forEach((l) => mapInstance.removeLayer(l));
      mapInstance.pm.enableDraw("Polygon");
      setDrawnGeoJSON(null);
      setCentroid(null);
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
                <CardHeader>
                  <CardTitle>Polygon Area (ha)</CardTitle>
                </CardHeader>
                <CardContent>
                  {drawnGeoJSON ? (turfArea(drawnGeoJSON) / 10000).toFixed(2) : "-"}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>NDVI</CardTitle>
                </CardHeader>
                <CardContent>{ndvi !== null ? ndvi : "-"}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>AWB</CardTitle>
                </CardHeader>
                <CardContent>{awb !== null ? awb : "-"}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Estimated Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  {estimatedEarnings !== null ? `₹${estimatedEarnings}` : "-"}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              {drawnGeoJSON && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Boundary"}
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
