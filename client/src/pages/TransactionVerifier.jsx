import React, { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Copy,
  Hash,
  Wallet,
  ArrowRight,
  Box,
  Clock,
  GanttChartSquare,
  Coins,
  Flame,
} from "lucide-react";

const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-muted-foreground">{label}</span>
    </div>
    <div className="font-mono text-right">{children}</div>
  </div>
);

const Copyable = ({ value }) => {
  const displayValue = value ? `${value.slice(0, 10)}...${value.slice(-8)}` : "N/A";

  const copyToClipboard = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard!", { description: value });
  };

  return (
    <div className="flex items-center gap-2">
      <span>{displayValue}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={copyToClipboard}
        className="h-7 w-7"
        disabled={!value}
      >
        <Copy className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
};

const TransactionVerifier = () => {
  const [txHash, setTxHash] = useState("");
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifyTransaction = async () => {
    if (!ethers.isHexString(txHash, 32)) {
      toast.error("Invalid Hash", {
        description: "Please enter a valid 32-byte transaction hash.",
      });
      return;
    }

    setIsLoading(true);
    setTransactionDetails(null);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        const notFoundError = "Transaction hash not found on your local Hardhat blockchain.";
        toast.error("Not Found", { description: notFoundError });
        setError(notFoundError);
        return;
      }

      const block = await provider.getBlock(tx.blockNumber);

      setTransactionDetails({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        timestamp: new Date(block.timestamp * 1000).toLocaleString(),
        blockNumber: tx.blockNumber.toString(),
        gasPrice: ethers.formatUnits(tx.gasPrice, "gwei"),
      });

      toast.success("Transaction Verified", {
        description: "Successfully fetched transaction details.",
      });
    } catch (err) {
      const connectionError =
        "Could not connect to the Hardhat node. Is it running at http://127.0.0.1:8545?";
      toast.error("Verification Failed", { description: connectionError });
      setError(connectionError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-lg w-fit mb-4">
            <GanttChartSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Hardhat Transaction Verifier</CardTitle>
          <CardDescription>
            Enter a transaction hash from your local node to verify details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter transaction hash (e.g., 0x...)"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="h-12 font-mono"
              onKeyUp={(e) => e.key === "Enter" && verifyTransaction()}
            />
            <Button onClick={verifyTransaction} disabled={isLoading} className="h-12 px-6">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </div>

          {(transactionDetails || error) && (
            <div className="pt-4">
              <Separator />
              {transactionDetails && (
                <div className="mt-4 text-sm space-y-1">
                  <DetailRow icon={<Hash className="h-4 w-4 text-primary" />} label="Hash">
                    <Copyable value={transactionDetails.hash} />
                  </DetailRow>
                  <Separator />
                  <DetailRow icon={<Wallet className="h-4 w-4 text-primary" />} label="From">
                    <Copyable value={transactionDetails.from} />
                  </DetailRow>
                  <Separator />
                  <DetailRow icon={<ArrowRight className="h-4 w-4 text-primary" />} label="To">
                    <Copyable value={transactionDetails.to} />
                  </DetailRow>
                  <Separator />
                  <DetailRow icon={<Box className="h-4 w-4 text-primary" />} label="Block Number">
                    <span>{transactionDetails.blockNumber}</span>
                  </DetailRow>
                  <Separator />
                  <DetailRow icon={<Clock className="h-4 w-4 text-primary" />} label="Timestamp">
                    <span>{transactionDetails.timestamp}</span>
                  </DetailRow>
                  <Separator />
                  <DetailRow icon={<Coins className="h-4 w-4 text-primary" />} label="Amount">
                    <span className="font-semibold text-primary">
                      {transactionDetails.value} ETH
                    </span>
                  </DetailRow>
                  <Separator />
                  <DetailRow icon={<Flame className="h-4 w-4 text-primary" />} label="Gas Price">
                    <span className="font-semibold text-primary">
                      {transactionDetails.gasPrice} Gwei
                    </span>
                  </DetailRow>
                </div>
              )}
              {error && (
                <div className="mt-6 text-center text-destructive bg-destructive/10 p-4 rounded-md">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionVerifier;
