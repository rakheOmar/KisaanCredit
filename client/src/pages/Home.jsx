import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DotGrid from "@/components/blocks/Heros/DotGrid";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const pageRoutes = [
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Sign Up" },
  { path: "/contact", name: "Contact Us" },
  { path: "/peer-call", name: "PeerJS Video Call" },
  { path: "/user-profile", name: "User Profile" },
  { path: "/payment", name: "Payment Page" },
  { path: "/verify-transaction", name: "Transaction Verifier" },
  { path: "/aadhaar-verify", name: "Aadhaar Verification" },
];

const Home = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/payments/all`, {
          withCredentials: true,
        });
        setTransactions(response.data.data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast.error("Could not load the transaction feed.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    const handleNewPayment = (newPayment) => {
      setTransactions((prevTransactions) => [newPayment, ...prevTransactions]);
    };

    socket.on("new_payment", handleNewPayment);
    socket.on("connect", () => console.log("Live feed connected:", socket.id));
    socket.on("disconnect", () => console.log("Live feed disconnected"));

    return () => {
      socket.off("new_payment", handleNewPayment);
    };
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center p-10">Loading transactions...</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pageRoutes.map((route) => (
            <Button key={route.path} variant="outline" onClick={() => navigate(route.path)}>
              {route.name}
            </Button>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Live Transaction Feed</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Razorpay ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Blockchain Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={tx.user?.avatar} alt={tx.user?.fullname} />
                        <AvatarFallback>{tx.user?.fullname?.[0] || "A"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{tx.user?.fullname || "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">{tx.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tx.currency} {tx.amount}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tx.razorpay_payment_id}</TableCell>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs break-all">
                    <a
                      href={`#`}
                      className="text-blue-500 hover:underline"
                      title={tx.blockchain_tx_hash}
                    >
                      {tx.blockchain_tx_hash
                        ? `${tx.blockchain_tx_hash.substring(0, 10)}...`
                        : "N/A"}
                    </a>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="5" className="text-center h-24">
                  No transactions yet. Make a payment to see it appear here live!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Home;
