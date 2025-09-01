import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import axiosInstance from "@/lib/axios";

export default function Home() {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const res = await axiosInstance.get(`/users/credits/top`, {
          headers: { "Cache-Control": "no-cache" },
          params: { ts: Date.now() },
        });
        if (res.data?.data) {
          setTopUsers(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching top users:", error);
      }
    };
    fetchTopUsers();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <header className="text-center max-w-2xl mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome to NABARD H2S Platform</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Manage your projects efficiently and estimate your carbon credit earnings.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/dashboard-project/create-project")}
        >
          <CardHeader>
            <CardTitle>Create Project</CardTitle>
            <CardDescription>
              Start a new project and manage your carbon initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" className="w-full mt-4">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/estimate-earnings")}
        >
          <CardHeader>
            <CardTitle>Estimate Earnings</CardTitle>
            <CardDescription>
              Calculate potential earnings from your carbon credit projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" className="w-full mt-4">
              Estimate Now
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-4xl mt-16">
        <h2 className="text-2xl font-semibold mb-4 text-center">Top 10 Carbon Credit Leaders</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Money Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.length > 0 ? (
                  topUsers.map((user, index) => (
                    <TableRow key={user._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.carbonCredits}</TableCell>
                      <TableCell>₹{user.moneyEarned}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-24 text-center text-muted-foreground">
        &copy; {new Date().getFullYear()} NABARD H2S. All rights reserved.
      </footer>
    </div>
  );
}
