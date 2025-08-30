import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const navigate = useNavigate();

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

      <footer className="mt-24 text-center text-muted-foreground">
        &copy; {new Date().getFullYear()} NABARD H2S. All rights reserved.
      </footer>
    </div>
  );
}
