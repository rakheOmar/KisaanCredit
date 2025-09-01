import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  CreditCard,
  User,
  Calendar,
  FileText,
  IndianRupee,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Leaf,
  MapPin,
  Coins,
  TrendingUp,
  Zap,
  Clock,
  Shield,
  Target,
} from "lucide-react";

const GiveCreditPage = () => {
  const { user } = useAuth();
  const { userid } = useParams();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    userId: userid || "",
    creditAmount: "",
    creditType: "",
    reason: "",
    description: "",
    validityPeriod: "12", // months
    pricePerCredit: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch user information
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userid) {
        setLoadingUser(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/users/profile/${userid}`);
        console.log("User info response:", response.data);
        setUserInfo(response.data.data);
      } catch (error) {
        console.error("Error fetching user info:", error);
        toast.error("Failed to fetch user information");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserInfo();
  }, [userid]);

  // Handle form input changes
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = "User ID is required";
    }

    if (!formData.creditAmount || parseFloat(formData.creditAmount) <= 0) {
      newErrors.creditAmount = "Credit amount must be greater than 0";
    }

    if (!formData.creditType) {
      newErrors.creditType = "Credit type is required";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    }

    if (formData.pricePerCredit && parseFloat(formData.pricePerCredit) <= 0) {
      newErrors.pricePerCredit = "Price per credit must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userId: formData.userId,
        creditAmount: parseFloat(formData.creditAmount),
        creditType: formData.creditType,
        reason: formData.reason,
        description: formData.description || undefined,
        validityMonths: parseInt(formData.validityPeriod),
        pricePerCredit: formData.pricePerCredit ? parseFloat(formData.pricePerCredit) : undefined,
        issuedBy: user?.id || user?._id,
        issuedAt: new Date().toISOString(),
      };

      const response = await axiosInstance.post("/users/credits/add", payload);

      toast.success("Credits issued successfully!");

      // Reset form or navigate back
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error("Error issuing credits:", error);
      const errorMessage = error.response?.data?.message || "Failed to issue credits";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total value
  const totalValue =
    formData.creditAmount && formData.pricePerCredit
      ? (parseFloat(formData.creditAmount) * parseFloat(formData.pricePerCredit)).toFixed(2)
      : "0.00";

  // Get user initials for avatar fallback
  const getUserInitials = (fullName) => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Credit type icons mapping
  const getCreditTypeIcon = (type) => {
    const iconMap = {
      carbon_sequestration: <Leaf className="h-4 w-4" />,
      emission_reduction: <Zap className="h-4 w-4" />,
      sustainable_farming: <Target className="h-4 w-4" />,
      renewable_energy: <Zap className="h-4 w-4" />,
      reforestation: <Leaf className="h-4 w-4" />,
      other: <Shield className="h-4 w-4" />,
    };
    return iconMap[type] || <Shield className="h-4 w-4" />;
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading user information...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Issue Carbon Credits</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Issue environmental credits to farmers and users
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Real-time processing</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Form - Takes 3 columns */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                Credit Information
              </CardTitle>
              <CardDescription className="text-base">
                Fill in the details to issue carbon credits to the recipient
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* User ID Section */}
                <div className="space-y-3">
                  <Label
                    htmlFor="userId"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Recipient User ID
                  </Label>
                  <Input
                    id="userId"
                    value={formData.userId}
                    onChange={(e) => handleInputChange("userId", e.target.value)}
                    placeholder="Enter user ID"
                    disabled={!!userid}
                    className="h-12 text-base"
                  />
                  {errors.userId && (
                    <Alert variant="destructive" className="py-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-base">{errors.userId}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                {/* Credit Details Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Credit Details</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="creditAmount"
                        className="text-base font-semibold flex items-center gap-2"
                      >
                        <Leaf className="h-4 w-4" />
                        Credit Amount
                      </Label>
                      <Input
                        id="creditAmount"
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.creditAmount}
                        onChange={(e) => handleInputChange("creditAmount", e.target.value)}
                        placeholder="e.g., 1.250"
                        className="h-12 text-base"
                      />
                      {errors.creditAmount && (
                        <Alert variant="destructive" className="py-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-base">
                            {errors.creditAmount}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="pricePerCredit"
                        className="text-base font-semibold flex items-center gap-2"
                      >
                        <IndianRupee className="h-4 w-4" />
                        Price per Credit (₹)
                      </Label>
                      <Input
                        id="pricePerCredit"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricePerCredit}
                        onChange={(e) => handleInputChange("pricePerCredit", e.target.value)}
                        placeholder="e.g., 500.00"
                        className="h-12 text-base"
                      />
                      {errors.pricePerCredit && (
                        <Alert variant="destructive" className="py-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-base">
                            {errors.pricePerCredit}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="creditType" className="text-base font-semibold">
                        Credit Type
                      </Label>
                      <Select
                        value={formData.creditType}
                        onValueChange={(value) => handleInputChange("creditType", value)}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select credit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carbon_sequestration" className="py-3">
                            <div className="flex items-center gap-2">
                              <Leaf className="h-4 w-4" />
                              Carbon Sequestration
                            </div>
                          </SelectItem>
                          <SelectItem value="emission_reduction" className="py-3">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Emission Reduction
                            </div>
                          </SelectItem>
                          <SelectItem value="sustainable_farming" className="py-3">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Sustainable Farming
                            </div>
                          </SelectItem>
                          <SelectItem value="renewable_energy" className="py-3">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Renewable Energy
                            </div>
                          </SelectItem>
                          <SelectItem value="reforestation" className="py-3">
                            <div className="flex items-center gap-2">
                              <Leaf className="h-4 w-4" />
                              Reforestation
                            </div>
                          </SelectItem>
                          <SelectItem value="other" className="py-3">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Other
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.creditType && (
                        <Alert variant="destructive" className="py-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-base">
                            {errors.creditType}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="validityPeriod"
                        className="text-base font-semibold flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Validity Period
                      </Label>
                      <Select
                        value={formData.validityPeriod}
                        onValueChange={(value) => handleInputChange("validityPeriod", value)}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select validity period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                          <SelectItem value="36">36 Months</SelectItem>
                          <SelectItem value="60">60 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Additional Information</h3>

                  <div className="space-y-3">
                    <Label
                      htmlFor="reason"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Reason
                    </Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      placeholder="e.g., Sustainable farming practices"
                      className="h-12 text-base"
                    />
                    {errors.reason && (
                      <Alert variant="destructive" className="py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-base">{errors.reason}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-semibold">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Additional details about the credit issuance..."
                      className="text-base resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full h-14 text-base font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Issuing Credits...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-3" />
                        Issue Credits
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* User Information */}
          {userInfo && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Recipient
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Avatar and basic info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={userInfo.avatar} alt={userInfo.fullName} />
                      <AvatarFallback className="text-lg font-semibold">
                        {getUserInitials(userInfo.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{userInfo.fullName}</p>
                      <p className="text-muted-foreground">@{userInfo.username}</p>
                      <Badge variant="secondary" className="mt-2 capitalize">
                        {userInfo.role}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* User Details */}
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-semibold">{userInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {userInfo._id.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Member Since:</span>
                      <span className="font-semibold">
                        {new Date(userInfo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Current Credits & Earnings */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Coins className="h-5 w-5" />
                          <span className="text-sm font-medium text-muted-foreground">Credits</span>
                        </div>
                        <p className="text-xl font-bold">
                          {userInfo.carbonCredits?.toFixed(3) || "0.000"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <TrendingUp className="h-5 w-5" />
                          <span className="text-sm font-medium text-muted-foreground">Earned</span>
                        </div>
                        <p className="text-xl font-bold">
                          ₹{userInfo.moneyEarned?.toLocaleString() || "0"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Farm Information */}
                  {userInfo.farmLand && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="font-semibold text-sm">Farm Details</span>
                        </div>
                        <div className="space-y-3 text-sm bg-muted rounded-lg p-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Area:</span>
                            <span className="font-semibold">
                              {userInfo.farmLand.areaInHectares} ha
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Coordinates:</span>
                            <span className="font-mono text-xs">
                              {userInfo.farmLand.geoJson.coordinates[0].length - 1} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Credit Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IndianRupee className="h-5 w-5" />
                  Credit Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{formData.creditAmount || "0.000"}</p>
                    <p className="text-muted-foreground mt-1">Credits to be issued</p>
                  </div>

                  {formData.pricePerCredit && (
                    <div className="text-center py-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">₹{totalValue}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total estimated value</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Type:</span>
                      <div className="flex items-center gap-2">
                        {formData.creditType && getCreditTypeIcon(formData.creditType)}
                        <span className="font-semibold capitalize">
                          {formData.creditType?.replace("_", " ") || "Not selected"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Validity:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formData.validityPeriod} months
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 p-6">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Credits will be immediately available to the recipient</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>All transactions are logged and auditable</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Validity period starts from the issuance date</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p>Price per credit is optional for record keeping</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default GiveCreditPage;
