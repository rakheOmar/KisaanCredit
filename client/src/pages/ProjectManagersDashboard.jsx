import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  PlusCircle,
  Eye,
  Edit,
  FolderKanban,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";

export default function ProjectManagersDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get("/projects");
      setProjects(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Maps project status to a corresponding Badge variant
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default"; // Primary color (usually dark)
      case "completed":
        return "secondary"; // Gray color
      case "pending":
      case "draft":
        return "outline"; // Transparent with a border
      default:
        return "outline";
    }
  };

  const renderSkeleton = () =>
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell className="py-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </TableCell>
        <TableCell className="py-4">
          <Skeleton className="h-6 w-24 rounded-md" />
        </TableCell>
        <TableCell className="py-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </TableCell>
        <TableCell className="py-4">
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell className="py-4">
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell className="py-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </TableCell>
      </TableRow>
    ));

  const renderEmptyState = () => (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6">
        <FolderKanban className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Get started by creating your first carbon offset project to track and manage your
        environmental impact.
      </p>
      <Button onClick={() => navigate("/dashboard-project/create-project")}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Your First Project
      </Button>
    </div>
  );

  const stats = [
    {
      name: "Total Projects",
      value: projects.length,
      icon: FolderKanban,
    },
    {
      name: "Active Projects",
      value: projects.filter((p) => p.status?.toLowerCase() === "active").length,
      icon: Activity,
    },
    {
      name: "Completed",
      value: projects.filter((p) => p.status?.toLowerCase() === "completed").length,
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toaster position="top-center" richColors />

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Carbon Projects Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor and manage your environmental impact projects
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard-project/create-project")} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Projects Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Projects Overview</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {projects.length} {projects.length === 1 ? "project" : "projects"} in total
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {projects.length === 0 && !loading ? (
              renderEmptyState()
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-4 px-6">Project Details</TableHead>
                      <TableHead className="py-4">Type</TableHead>
                      <TableHead className="py-4">Status</TableHead>
                      <TableHead className="py-4">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" /> Start Date
                        </div>
                      </TableHead>
                      <TableHead className="py-4">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" /> End Date
                        </div>
                      </TableHead>
                      <TableHead className="py-4 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? renderSkeleton()
                      : projects.map((project) => (
                          <TableRow key={project._id}>
                            <TableCell className="py-4 px-6">
                              <div>
                                <div className="font-medium text-foreground mb-1">
                                  {project.projectName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {project._id.slice(-8)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="outline">{project.projectType}</Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant={getStatusVariant(project.status)}>
                                {project.status || "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-muted-foreground">
                              {formatDate(project.creditingPeriod?.startDate)}
                            </TableCell>
                            <TableCell className="py-4 text-muted-foreground">
                              {formatDate(project.creditingPeriod?.endDate)}
                            </TableCell>
                            <TableCell className="py-4 text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/dashboard-project/${project._id}`)}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate(`/dashboard-project/edit/${project._id}`)
                                    }
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Project
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
