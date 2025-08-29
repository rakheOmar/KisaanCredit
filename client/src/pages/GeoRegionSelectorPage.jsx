import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { centroid as turfCentroid } from "@turf/turf";
import { toast, Toaster } from "sonner";
import { Navigate } from "react-router-dom";
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

const GeoRegionSelectorPage = () => {
  const [drawnGeoJSON, setDrawnGeoJSON] = useState(null);
  const [centroid, setCentroid] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState([51.505, -0.09]);
  const [ndvi, setNdvi] = useState(null);
  const [awb, setAwb] = useState(null);

  const { user, loading } = useAuth();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          if (mapInstance) {
            mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 13);
          }
        },
        () => {
          toast.error("Unable to fetch current location.");
        }
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
      const { layer } = e;
      const geojson = layer.toGeoJSON();
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
    };

    const handleShapeEdited = (e) => {
      const { layer } = e;
      const geojson = layer.toGeoJSON();
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
          toast.warn("Only one boundary can be drawn. Please delete the existing one first.");
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
      if (mapInstance.pm) {
        mapInstance.pm.removeControls();
      }
      mapInstance.off("pm:create", onCreate);
      mapInstance.off("pm:edit", handleShapeEdited);
      mapInstance.off("pm:remove", onRemove);
    };
  }, [mapInstance]);

  const handleSubmit = async () => {
    if (!drawnGeoJSON || !centroid) {
      toast.error("Please draw a boundary on the map first.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting boundary data...");
    try {
      const res = await axiosInstance.post("/regions", {
        geojson: drawnGeoJSON,
        centroid: {
          type: "Point",
          coordinates: centroid,
        },
      });
      toast.success("Boundary submitted successfully!", { id: toastId });
      setNdvi(res.data?.data?.ndvi || null);
      setAwb(res.data?.data?.awb || null);
      if (mapInstance) {
        const layers = mapInstance.pm.getGeomanLayers();
        layers.forEach((l) => mapInstance.removeLayer(l));
        mapInstance.pm.enableDraw("Polygon");
      }
      setDrawnGeoJSON(null);
      setCentroid(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit boundary.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Select a Geographic Boundary</CardTitle>
            <CardDescription>
              Use the polygon tool on the map to draw a boundary of interest. After drawing, you can
              submit the boundary’s data.
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
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Boundary GeoJSON</h3>
                <pre className="p-4 rounded-md bg-slate-100 dark:bg-slate-800 text-sm overflow-auto h-64">
                  {drawnGeoJSON
                    ? JSON.stringify(drawnGeoJSON, null, 2)
                    : "Draw a polygon on the map..."}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Centroid Coordinates</h3>
                <pre className="p-4 rounded-md bg-slate-100 dark:bg-slate-800 text-sm overflow-auto h-64">
                  {centroid ? JSON.stringify(centroid, null, 2) : "Waiting for boundary..."}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">NDVI & AWB Values</h3>
                <pre className="p-4 rounded-md bg-slate-100 dark:bg-slate-800 text-sm overflow-auto h-64">
                  {ndvi !== null && awb !== null
                    ? JSON.stringify({ ndvi, awb }, null, 2)
                    : "Submit a boundary to calculate..."}
                </pre>
              </div>
            </div>

            {/* Submit button only shows if a boundary exists */}
            <div className="mt-6 flex justify-end">
              {drawnGeoJSON && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Boundary"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default GeoRegionSelectorPage;
