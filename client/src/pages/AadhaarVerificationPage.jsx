import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MapPin,
  Mail,
  Phone,
  QrCode,
  UploadCloud,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { verifyAadhaarQrCode } from "@/lib/aadhaarService";
import { cn } from "@/lib/utils";

const FileUploader = ({ onFileSelect, preview, disabled }) => {
  const fileInputRef = useRef(null);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 h-full",
        !preview && "hover:border-primary cursor-pointer",
        disabled && "cursor-not-allowed bg-muted/50"
      )}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
        disabled={disabled}
      />
      {preview ? (
        <img
          src={preview}
          alt="QR Code Preview"
          className="mx-auto max-h-48 w-auto rounded-md border"
        />
      ) : (
        <div className="flex flex-col items-center space-y-3 text-muted-foreground">
          <UploadCloud className="h-12 w-12" />
          <p className="font-semibold">Upload QR Code</p>
          <span className="text-sm">Click to upload Aadhaar QR image</span>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      {icon} {label}
    </p>
    <p className="text-base font-semibold">{value || "N/A"}</p>
  </div>
);

const VerificationResult = ({ result }) => {
  if (!result) return null;

  const { success, data, message } = result;

  if (!success) {
    return (
      <Card className="w-full h-full border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle /> Verification Failed
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const address = [
    data.house,
    data.street,
    data.landmark,
    data.location,
    data.subdistrict,
    data.district,
    data.state,
    data.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="w-full h-full border-green-500 bg-green-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle /> Verification Successful
        </CardTitle>
        <CardDescription>Aadhaar verified successfully.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem icon={<User size={16} />} label="Name" value={data.name} />
            <DetailItem icon={<Calendar size={16} />} label="Date of Birth" value={data.dob} />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Address</h3>
          <DetailItem icon={<MapPin size={16} />} label="Full Address" value={address} />
        </div>
        <div>
          <h3 className="font-semibold mb-3">Contact Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem
              icon={<Mail size={16} />}
              label="Email Verified"
              value={data.email ? "Yes" : "No"}
            />
            <DetailItem
              icon={<Phone size={16} />}
              label="Mobile Verified"
              value={data.mobile ? "Yes" : "No"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AadhaarVerificationPage() {
  const [qrImage, setQrImage] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setVerificationResult(null);
    setQrImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setQrPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVerification = async () => {
    if (!qrImage) {
      toast.error("QR image required", {
        description: "Please upload the Aadhaar QR code image.",
      });
      return;
    }
    setIsLoading(true);
    setVerificationResult(null);
    try {
      const result = await verifyAadhaarQrCode(qrImage);
      setVerificationResult(result);
      if (result.success) {
        toast.success("Verification successful!");
      } else {
        toast.error("Verification Failed", { description: result.message });
      }
    } catch (error) {
      setVerificationResult({ success: false, message: error.message });
      toast.error("Verification Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetProcess = () => {
    setQrImage(null);
    setQrPreview(null);
    setVerificationResult(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Aadhaar QR Verification</h1>
        <p className="mt-2 text-muted-foreground">
          Upload and instantly verify Aadhaar QR code details.
        </p>
      </div>

      <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode /> Upload QR Code
            </CardTitle>
            <CardDescription>Click the box to upload Aadhaar QR code.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-6">
            <FileUploader
              onFileSelect={handleFileChange}
              preview={qrPreview}
              disabled={isLoading}
            />
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={resetProcess} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button onClick={handleVerification} disabled={isLoading || !qrImage}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Verifying..." : "Verify Aadhaar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full rounded-xl bg-muted">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          ) : (
            <VerificationResult result={verificationResult} />
          )}
        </div>
      </div>
    </div>
  );
}
