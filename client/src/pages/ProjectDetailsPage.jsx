import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, UserPlus, FileText, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProjectDetailsPage() {
  const navigate = useNavigate();

  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch the project details on page load
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axiosInstance.get(`/projects/${id}`);
        setProject(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch project");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  // Fetch all farmers to populate the modal
  const fetchAllFarmers = async () => {
    try {
      const res = await axiosInstance.get(`/farmers/`);
      setAllUsers(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch farmers");
    }
  };

  // Add participant to project
  const handleAddParticipant = async () => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }

    try {
      await axiosInstance.post(`/projects/${id}/participants`, {
        participantId: selectedUser._id,
      });
      toast.success("Participant added successfully");
      // Refresh the project after adding the participant
      await fetchProject();
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Failed to add participant");
    }
  };

  // Open the modal and fetch all farmers
  const handleOpenModal = () => {
    fetchAllFarmers();
    setIsModalOpen(true);
  };

  // Render the project status variant badge
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
      case "inactive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // If loading, show a loading spinner
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If no project found, show error message
  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground text-center">
              The project you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Toaster position="top-center" richColors />

      {/* Project Header */}
      <Card className="border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{project.projectName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{project.projectType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {project.location?.state || "No location"},{" "}
                    {project.location?.district || "No district"}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={getStatusVariant(project.status)} className="text-sm px-3 py-1">
              {project.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
          className="data-[state=active]:bg-background data-[state=active]:text-foreground"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "participants" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("participants")}
          className="data-[state=active]:bg-background data-[state=active]:text-foreground"
        >
          Participants
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Carbon Standard
                    </label>
                    <p className="font-medium">{project.carbonStandard}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Methodology</label>
                    <p className="font-medium">{project.methodology}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crediting Period Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Crediting Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-lg font-semibold">
                      {project.creditingPeriod?.startDate
                        ? new Date(project.creditingPeriod.startDate).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="hidden sm:block text-muted-foreground">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="text-lg font-semibold">
                      {project.creditingPeriod?.endDate
                        ? new Date(project.creditingPeriod.endDate).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === "participants" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              Project Participants
              <Badge variant="secondary" className="ml-2">
                {project.participants?.length || 0}
              </Badge>
            </CardTitle>

            {/* Add Participant Dialog Trigger */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenModal} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Participant
                </Button>
              </DialogTrigger>

              {/* Add Participant Modal Content */}
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add Participant
                  </DialogTitle>
                  <DialogDescription>
                    Select a user to add as a participant to this project.
                  </DialogDescription>
                </DialogHeader>

                {/* List of Farmers */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allUsers.length > 0 ? (
                    allUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                          selectedUser?._id === user._id
                            ? "bg-accent border-primary"
                            : "border-border hover:border-accent-foreground/20"
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email || "User"}</p>
                        </div>
                        {selectedUser?._id === user._id && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No users available</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddParticipant} disabled={!selectedUser} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Participant
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>

          {/* Participants List */}
          <CardContent>
            {project.participants && project.participants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.participants.map((participant) => (
                  <Card key={participant._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={participant.avatar} alt={participant.name} />
                          <AvatarFallback>
                            {participant.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{participant.name}</h3>
                          <p className="text-sm text-muted-foreground">Participant</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2 hover:bg-accent"
                        onClick={() => {
                          navigate(`/logs/${participant._id}`);
                        }}
                      >
                        View Logs
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Get started by adding your first participant to begin tracking project activities.
                </p>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenModal} size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      Add First Participant
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
