import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Leaf, CalendarDays, Banknote, Sprout, Activity, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const LogsPage = () => {
  const { user } = useAuth();
  const { farmerId } = useParams();
  const [seasonalLogs] = useState([
    {
      _id: "static1",
      cropType: "Rice",
      cropVariety: "Basmati",
      plantingDate: "2025-06-02T00:00:00.000Z",
    },
  ]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  const sidebarRef = useRef(null);

  // Monitor sidebar height changes
  useEffect(() => {
    if (sidebarRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setSidebarHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(sidebarRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [sidebarRef.current]);

  const fetchDailyLogs = async () => {
    try {
      const response = await axiosInstance.get(`farmers/farmer-daily-logs/${farmerId}`);
      const sortedLogs = (response.data.data || []).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setDailyLogs(sortedLogs);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
      toast.error(error.response?.data?.message || "Failed to fetch daily logs");
      setError("Failed to fetch daily logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !farmerId) {
      setLoading(false);
      return;
    }
    fetchDailyLogs();
  }, [user, farmerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading farming logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!farmerId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Missing Farmer ID</CardTitle>
            <CardDescription>Farmer ID is missing from the URL.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const today = new Date();
  const seasonalLog = seasonalLogs[0];
  const plantingDate = new Date(seasonalLog.plantingDate);
  const daysSincePlanting = Math.max(0, Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24)));

  const calculateDailyEmission = (log, days) => {
    let ndvi = 0.3;
    if (days >= 20 && days < 50) ndvi = 0.5;
    else if (days >= 50 && days < 70) ndvi = 0.7;
    else if (days >= 70) ndvi = 0.8;
    const carbonFromBiomass = ndvi * 18;

    const fertilizerN = log.fertilizerApplication?.amount || 0;
    const n2oEmissions = fertilizerN * 0.01;
    const n2oCO2eq = n2oEmissions * (44 / 28) * 298;

    return carbonFromBiomass + n2oCO2eq;
  };

  const dailyEmissions = new Map();
  dailyLogs.forEach((log) => {
    const logDate = new Date(log.date);
    const days = Math.floor((logDate - plantingDate) / (1000 * 60 * 60 * 24));
    if (days >= 0) {
      const totalCarbonEmission = calculateDailyEmission(log, days);
      dailyEmissions.set(days, (dailyEmissions.get(days) || 0) + totalCarbonEmission);
    }
  });

  const getLinearBaseline = (day) => {
    const startValue = 70;
    const endValue = 12500;
    return startValue + ((endValue - startValue) * (day - 1)) / 119;
  };

  const chartData = [];
  let dailyCarbonSumTillDay = 0;
  const lastLogDay =
    dailyLogs.length > 0
      ? Math.floor(
          (new Date(dailyLogs[dailyLogs.length - 1].date) - plantingDate) / (1000 * 60 * 60 * 24)
        )
      : -1;

  for (let i = 0; i <= 120; i++) {
    if (dailyEmissions.has(i)) {
      dailyCarbonSumTillDay += dailyEmissions.get(i);
    }
    const baselineCarbon = getLinearBaseline(i + 1);
    chartData.push({
      day: i + 1,
      Baseline: baselineCarbon,
      "Daily Logs": i <= lastLogDay && dailyCarbonSumTillDay > 0 ? dailyCarbonSumTillDay : null,
    });
  }

  const lastLoggedCarbon = lastLogDay >= 0 ? chartData[lastLogDay]?.["Daily Logs"] || 0 : 0;
  const averageDailyEmission = lastLogDay > 0 ? lastLoggedCarbon / (lastLogDay + 1) : 0;

  let predictedSum = 0;
  chartData.forEach((dataPoint, i) => {
    if (i < lastLogDay) {
      dataPoint["Predicted"] = null;
    } else if (i === lastLogDay) {
      dataPoint["Predicted"] = lastLoggedCarbon;
      predictedSum = lastLoggedCarbon;
    } else if (i > lastLogDay) {
      predictedSum += averageDailyEmission;
      dataPoint["Predicted"] = predictedSum;
    } else {
      dataPoint["Predicted"] = null;
    }
  });

  let currentNdvi = 0.3;
  if (daysSincePlanting >= 20 && daysSincePlanting < 50) currentNdvi = 0.5;
  else if (daysSincePlanting >= 50 && daysSincePlanting < 70) currentNdvi = 0.7;
  else if (daysSincePlanting >= 70 && daysSincePlanting < 100) currentNdvi = 0.8;
  else if (daysSincePlanting >= 100) currentNdvi = 0.85;

  const baselineCarbon = chartData[chartData.length - 1]?.Baseline || 0;
  const totalDailyCarbon = dailyCarbonSumTillDay;
  const carbonCreditsInKg = Math.max(0, baselineCarbon - totalDailyCarbon);
  const efficiency = baselineCarbon > 0 ? (carbonCreditsInKg / baselineCarbon) * 100 : 0;

  const creditsInTonnes = carbonCreditsInKg / 1000;
  const lowPriceINR = 500;
  const highPriceINR = 700;
  const estimatedLowValue = creditsInTonnes * lowPriceINR;
  const estimatedHighValue = creditsInTonnes * highPriceINR;

  return (
    <motion.div
      className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Growing</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysSincePlanting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current NDVI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentNdvi.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiency.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Daily Logs Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Logs</CardTitle>
              <CardDescription>
                Track daily activities and their environmental impact.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyLogs.length === 0 ? (
                <div
                  className="flex items-center justify-center text-center py-10"
                  style={{
                    height: sidebarHeight > 0 ? `${sidebarHeight - 120}px` : "400px",
                  }}
                >
                  <p className="text-muted-foreground">No logs have been submitted yet.</p>
                </div>
              ) : (
                <ScrollArea
                  className="w-full"
                  style={{
                    height: sidebarHeight > 0 ? `${sidebarHeight - 120}px` : "600px",
                  }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="w-[120px]">Water Status</TableHead>
                        <TableHead className="w-[140px]">Fertilizer</TableHead>
                        <TableHead className="w-[80px]">NDVI</TableHead>
                        <TableHead className="w-[130px]">Emission (kg CO₂eq)</TableHead>
                        <TableHead className="w-[100px]">Images</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyLogs.map((log) => {
                        const logDate = new Date(log.date);
                        const days = (logDate - plantingDate) / (1000 * 60 * 60 * 24);
                        let ndvi = 0.3;
                        if (days >= 20 && days < 50) ndvi = 0.5;
                        else if (days >= 50 && days < 70) ndvi = 0.7;
                        else if (days >= 70) ndvi = 0.8;
                        const totalCarbonEmission = calculateDailyEmission(log, days);

                        return (
                          <TableRow key={log._id}>
                            <TableCell className="font-medium">
                              {logDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  log.waterStatus === "Good"
                                    ? "default"
                                    : log.waterStatus === "Poor"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {log.waterStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.fertilizerApplication
                                ? `${log.fertilizerApplication.fertilizerType}: ${log.fertilizerApplication.amount} kg`
                                : "N/A"}
                            </TableCell>
                            <TableCell>{ndvi.toFixed(2)}</TableCell>
                            <TableCell>{totalCarbonEmission.toFixed(2)}</TableCell>
                            <TableCell>
                              {log.image && log.image.length > 0 ? (
                                <div className="flex gap-2 flex-wrap">
                                  {log.image.map((img, idx) => (
                                    <motion.img
                                      key={idx}
                                      src={img}
                                      alt="Log"
                                      className="w-12 h-12 object-cover rounded-md cursor-pointer border hover:border-primary"
                                      onClick={() => setSelectedImage(img)}
                                      whileHover={{ scale: 1.1 }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No Image</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Cards */}
        <div className="space-y-8" ref={sidebarRef}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-primary" /> Carbon Credits Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-5xl font-bold">{carbonCreditsInKg.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">kg CO₂-eq</p>
              <p className="text-xs text-muted-foreground mt-4">
                Seasonal Baseline: {baselineCarbon.toFixed(2)} kg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary" /> Seasonal Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Crop Type:</span>
                <span className="font-semibold">{seasonalLog.cropType}</span>
              </div>
              <div className="flex justify-between">
                <span>Variety:</span>
                <span className="font-semibold">{seasonalLog.cropVariety}</span>
              </div>
              <div className="flex justify-between">
                <span>Planted On:</span>
                <span className="font-semibold">{plantingDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Days Growing:</span>
                <span className="font-semibold">{daysSincePlanting}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" /> Potential Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center border-b pb-4">
                <p className="text-3xl font-bold">{creditsInTonnes.toFixed(3)}</p>
                <p className="text-sm text-muted-foreground">Tonnes CO₂-eq (Credits)</p>
              </div>
              <div className="text-center pt-2">
                <p className="text-2xl font-bold">
                  ₹{estimatedLowValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })} - ₹
                  {estimatedHighValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Est. value @ ₹{lowPriceINR}-₹{highPriceINR} per credit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          <motion.img
            src={selectedImage}
            alt="Preview"
            className="w-full h-auto rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          />
        </DialogContent>
      </Dialog>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Carbon Emission Comparison</CardTitle>
          <CardDescription>
            Tracking actual emissions against the baseline and future predictions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Baseline" stroke="red" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="Daily Logs"
                stroke="blue"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Predicted"
                stroke="green"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LogsPage;
