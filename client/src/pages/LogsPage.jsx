import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Toaster, toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";

const LogsPage = () => {
  const { user } = useAuth();
  const { farmerId } = useParams();
  const [seasonalLogs, setSeasonalLogs] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeasonalLogs = async () => {
    console.log("Fetching seasonal logs for farmerId:", farmerId);
    console.log("User:", user);

    try {
      setLoading(true);
      setError(null);

      const url = `farmers/${farmerId}/seasonal-logs`;
      console.log("Making request to:", url);

      const response = await axiosInstance.get(url);
      console.log("Response:", response.data);

      setSeasonalLogs(response.data.data);
    } catch (error) {
      console.error("Error fetching seasonal logs:", error);
      console.error("Error response:", error.response);

      const errorMessage =
        error.response?.data?.message || error.message || "Failed to fetch seasonal logs";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyLogs = async (seasonalLogId) => {
    try {
      const response = await axiosInstance.get(`farmers/seasonal-logs/${seasonalLogId}/daily-logs`);
      setDailyLogs(response.data.data);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
      toast.error(error.response?.data?.message || "Failed to fetch daily logs");
    }
  };

  useEffect(() => {
    console.log("useEffect triggered - User:", !!user, "FarmerId:", farmerId);

    if (!user) {
      console.log("No user found");
      setLoading(false);
      return;
    }

    if (!farmerId) {
      console.log("No farmerId found");
      setLoading(false);
      setError("Farmer ID is missing");
      return;
    }

    fetchSeasonalLogs();
  }, [user, farmerId]);

  // Debug render
  if (!user) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <p>User not authenticated. Please log in.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!farmerId) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <p>Farmer ID is missing from the URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleViewDailyLogs = (seasonalLogId) => {
    fetchDailyLogs(seasonalLogId);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* <Toaster /> */}

      {/* Debug info - remove in production */}
      <Card className="mb-4 bg-gray-50">
        <CardContent className="p-4">
          <p className="text-sm">
            Debug: User ID: {user?.id || user?._id || "N/A"} | Farmer ID: {farmerId} | Loading:{" "}
            {loading.toString()}
          </p>
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seasonal Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading seasonal logs...</p>
                <p className="text-sm text-gray-500 mt-2">Fetching data for farmer: {farmerId}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchSeasonalLogs} variant="outline">
                Retry
              </Button>
            </div>
          ) : seasonalLogs.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No seasonal logs found for this farmer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Crop Type</TableCell>
                  <TableCell>Crop Variety</TableCell>
                  <TableCell>Planting Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasonalLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{log.cropType}</TableCell>
                    <TableCell>{log.cropVariety || "N/A"}</TableCell>
                    <TableCell>{new Date(log.plantingDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        className="w-full gap-2 hover:bg-accent"
                        onClick={() => handleViewDailyLogs(log._id)}
                      >
                        View Daily Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dailyLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Water Status</TableCell>
                  <TableCell>Activity Notes</TableCell>
                  <TableCell>Fertilizer Application</TableCell>
                  <TableCell>Trees Planted</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell>{log.waterStatus}</TableCell>
                    <TableCell>{log.activityNotes || "N/A"}</TableCell>
                    <TableCell>
                      {log.fertilizerApplication
                        ? `${log.fertilizerApplication.type}: ${log.fertilizerApplication.amount} kg`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {log.treesPlanted
                        ? `${log.treesPlanted.numberOfTrees} ${log.treesPlanted.species}`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LogsPage;
