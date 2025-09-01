import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Shield,
  Clock,
  Coins,
  User,
  Hash,
  Activity,
  Globe,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { cn } from "@/lib/utils";

const TransactionVerify = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecipientProfile = async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/profile/${userId}`);
      if (response.data.success) {
        setRecipient(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch recipient profile:", error);
    }
  };

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/transactions/verify/${hash}`);
      if (response.data.success) {
        setTransaction(response.data.data);
        if (response.data.data.recipientUserId) {
          await fetchRecipientProfile(response.data.data.recipientUserId);
        }
      } else {
        setError("Transaction not found");
      }
    } catch {
      setError("Failed to fetch transaction details");
    } finally {
      setLoading(false);
    }
  };

  const verifyOnBlockchain = async () => {
    try {
      setVerifying(true);
      const response = await axiosInstance.post(`/transactions/verify/${hash}/blockchain`);
      if (response.data.success) {
        setTransaction((prev) => ({ ...prev, blockchainVerified: true }));
        toast.success("Transaction verified on blockchain!");
      } else {
        toast.error("Blockchain verification failed");
      }
    } catch {
      toast.error("Failed to verify on blockchain");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [hash]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Loading transaction...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate("/transactions")} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const InfoCard = ({ icon: Icon, title, value, subtitle, copyable = false }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-md bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-bold break-all">{value}</p>
              {copyable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(value)}
                  className="p-1 h-auto"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/transactions")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transaction Verification</h1>
            <p className="text-muted-foreground">
              Detailed information and blockchain verification
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              className={cn("px-3 py-1 text-sm font-semibold", getStatusColor(transaction?.status))}
            >
              {transaction?.blockchainVerified ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <Clock className="h-4 w-4 mr-1" />
              )}
              {transaction?.status || "Unknown"}
            </Badge>

            <Button
              onClick={verifyOnBlockchain}
              disabled={verifying || transaction?.blockchainVerified}
            >
              {verifying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {transaction?.blockchainVerified ? "Verified" : "Verify on Blockchain"}
            </Button>
          </div>
        </div>
      </div>

      {transaction?.blockchainVerified && (
        <Alert className="mb-8">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            This transaction has been successfully verified on the blockchain.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Transaction Hash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <code className="flex-1 p-2 bg-muted rounded font-mono text-sm break-all">
                  {hash}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(hash)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://etherscan.io/tx/${hash}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon={Clock}
              title="Transaction Date"
              value={formatDate(transaction?.createdAt)}
              subtitle="Local time"
            />

            <InfoCard
              icon={Activity}
              title="Block Number"
              value={transaction?.blockNumber?.toLocaleString() || "Pending"}
              subtitle="Blockchain confirmation"
              copyable
            />

            <InfoCard
              icon={Coins}
              title="Credits Transferred"
              value={transaction?.creditAmount?.toLocaleString() || "0"}
              subtitle={`Type: ${transaction?.creditType || "Unknown"}`}
            />

            <InfoCard
              icon={Globe}
              title="Price per Credit"
              value={formatCurrency(transaction?.pricePerCredit || 0)}
              subtitle={`Total: ${formatCurrency(transaction?.totalValue || 0)}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Recipient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">
                    {recipient?.username ||
                      (recipient?.firstName && recipient?.lastName
                        ? `${recipient.firstName} ${recipient.lastName}`
                        : "Unknown")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold">{recipient?.email || "Not provided"}</p>
                </div>
              </div>

              {recipient?.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg font-semibold">{recipient.phone}</p>
                </div>
              )}

              {recipient?.company && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="text-lg font-semibold">{recipient.company}</p>
                </div>
              )}

              {recipient?.walletAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                      {recipient.walletAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(recipient.walletAddress)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!recipient && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Unable to load recipient profile information
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="text-lg font-semibold">{transaction?.reason || "Not specified"}</p>
              </div>

              {transaction?.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{transaction.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gas Used</p>
                  <p className="font-semibold">
                    {transaction?.gasUsed?.toLocaleString() || "21,000 gas units"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gas Price</p>
                  <p className="font-semibold">{transaction?.gasPrice || "2.6"} Gwei</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Credits</span>
                <span className="font-bold">{transaction?.creditAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value</span>
                <span className="font-bold">{formatCurrency(transaction?.totalValue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <Badge>{transaction?.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.open(`https://etherscan.io/tx/${hash}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Etherscan
              </Button>

              <Button className="w-full justify-start" variant="outline" onClick={() => {}}>
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(transaction, null, 2))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Raw Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Transaction Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(transaction?.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Blockchain Confirmed</p>
                  <p className="text-sm text-muted-foreground">Block #{transaction?.blockNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {transaction?.blockchainVerified ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Manual Verification</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction?.blockchainVerified ? "Completed" : "Pending"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransactionVerify;
