import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  Users,
  CreditCard,
  IndianRupee,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalTransactions: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchUserProfile = async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/profile/${userId}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch {
      return null;
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        search: searchQuery,
      }).toString();
      const response = await axiosInstance.get(`/transactions?${queryParams}`);
      if (response.data.success) {
        const txs = response.data.data.transactions;
        const enrichedTxs = await Promise.all(
          txs.map(async (tx) => {
            if (tx.recipientUserId) {
              const recipient = await fetchUserProfile(tx.recipientUserId);
              return { ...tx, recipient };
            }
            return tx;
          })
        );
        setTransactions(enrichedTxs);
        setPagination(response.data.data.pagination);
      } else {
        toast.error("Failed to fetch transactions");
      }
    } catch {
      toast.error("Error loading transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get("/transactions/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch {
      toast.error("Failed to load statistics");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortBy) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get("/transactions/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Transactions exported successfully");
    } catch {
      toast.error("Failed to export transactions");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const StatCard = ({ icon: Icon, title, value }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-muted">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary"></div>
          <p className="text-muted-foreground font-medium">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage all carbon credit transactions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button onClick={handleExport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={TrendingUp}
              title="Total Transactions"
              value={stats.overview.totalTransactions.toLocaleString()}
            />
            <StatCard
              icon={CreditCard}
              title="Total Credits Issued"
              value={stats.overview.totalCreditsIssued.toLocaleString()}
            />
            <StatCard
              icon={IndianRupee}
              title="Total Value"
              value={formatCurrency(stats.overview.totalValue)}
            />
            <StatCard
              icon={Users}
              title="Avg Price/Credit"
              value={formatCurrency(stats.overview.avgPricePerCredit)}
            />
          </div>
        )}

        <Card>
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-xl font-semibold">All Transactions</CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead
                      className="cursor-pointer hover:bg-muted transition-colors font-semibold"
                      onClick={() => handleSortChange("createdAt")}
                    >
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                        {filters.sortBy === "createdAt" && (
                          <span className="ml-1">{filters.sortOrder === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Transaction Hash</TableHead>
                    <TableHead className="font-semibold">Recipient</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted transition-colors font-semibold"
                      onClick={() => handleSortChange("creditAmount")}
                    >
                      <div className="flex items-center">
                        Credits
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                        {filters.sortBy === "creditAmount" && (
                          <span className="ml-1">{filters.sortOrder === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Price/Credit</TableHead>
                    <TableHead className="font-semibold">Total Value</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatDate(transaction.createdAt)}</p>
                          <p className="text-sm text-muted-foreground">
                            Block: {transaction.blockNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code
                          className="text-xs bg-muted px-3 py-1.5 rounded-md font-mono border cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() =>
                            navigate(`/transactions/verify/${transaction.transactionHash}`)
                          }
                          title={`Click to verify transaction: ${transaction.transactionHash}`}
                        >
                          {transaction.transactionHash.slice(0, 10)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.recipient?.fullName || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.recipient?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.creditAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="border font-medium">
                          {transaction.creditType.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.pricePerCredit)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(transaction.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.reason}</p>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="font-medium">Confirmed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(pagination.currentPage - 1) * filters.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(pagination.currentPage * filters.limit, pagination.totalTransactions)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">{pagination.totalTransactions}</span>{" "}
                results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
