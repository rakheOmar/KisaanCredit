import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  UserPlus,
  FileText,
  ChevronRight,
  MapPin,
  Calendar,
  Activity,
  Settings,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function ProjectDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchAllFarmers = async () => {
    try {
      const res = await axiosInstance.get(`/farmers/`);
      setAllUsers(res.data.data);
    } catch {
      toast.error("Failed to fetch farmers");
    }
  };

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
      await fetchProject(); // Refetch project to update participant list
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch {
      toast.error("Failed to add participant");
    }
  };

  const handleOpenModal = () => {
    fetchAllFarmers();
    setIsModalOpen(true);
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "pending":
        return "outline";
      case "inactive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground text-center mb-6">
              The project you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Project Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Carbon Standard
                  </label>
                  <p className="text-lg font-semibold">{project.carbonStandard}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Methodology</label>
                  <p className="text-lg font-semibold">{project.methodology}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Crediting Period
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-2xl font-bold">
                    {project.creditingPeriod?.startDate
                      ? new Date(project.creditingPeriod.startDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not specified"}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground hidden sm:block" />
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-2xl font-bold">
                    {project.creditingPeriod?.endDate
                      ? new Date(project.creditingPeriod.endDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not specified"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.participants?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{project.status}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeTab === "participants") {
      return (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Project Participants</CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage project team members and contributors
              </p>
            </div>
            {renderAddParticipantDialog()}
          </CardHeader>
          <CardContent>
            {project.participants && project.participants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.participants.map((participant) => (
                  <Card key={participant._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={participant.avatar}
                            alt={participant.fullName || participant.username}
                          />
                          <AvatarFallback className="font-bold text-lg">
                            {(participant.fullName || participant.username)
                              ?.slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">
                            {participant.fullName || participant.username}
                          </h3>
                          <p className="text-sm text-muted-foreground">Project Participant</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => navigate(`/logs/${participant._id}`)}
                      >
                        <Activity className="h-4 w-4" /> View Activity Logs
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No participants yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Build your team by adding farmers to begin tracking activities.
                </p>
                {renderAddParticipantDialog(true)}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const renderAddParticipantDialog = (isFirst = false) => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpenModal} size={isFirst ? "lg" : "default"}>
          <Plus className="mr-2 h-4 w-4" /> {isFirst ? "Add First Participant" : "Add Participant"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <UserPlus className="h-5 w-5" /> Add New Participant
          </DialogTitle>
          <DialogDescription>
            Select a farmer to add as a participant to this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto p-1">
          {allUsers.length > 0 ? (
            allUsers.map((user) => (
              <div
                key={user._id}
                className={`flex items-center gap-4 p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedUser?._id === user._id ? "bg-accent border-primary" : "hover:bg-accent"
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.fullName || user.username} />
                  <AvatarFallback>
                    {(user.fullName || user.username)?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">{user.fullName || user.username}</h4>
                  <p className="text-sm text-muted-foreground">{user.email || "Farmer"}</p>
                </div>
                {selectedUser?._id === user._id && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No farmers available to add.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddParticipant} disabled={!selectedUser}>
            <Plus className="mr-2 h-4 w-4" /> Add Participant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Toaster position="top-center" richColors />

        <Button variant="ghost" onClick={() => navigate(-1)} className="group self-start">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  {project.projectName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-primary-foreground/80">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">{project.projectType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>
                      {project.location?.state || "N/A"}, {project.location?.district || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-3">
                <Badge
                  variant={getStatusVariant(project.status)}
                  className="text-base px-3 py-1 capitalize"
                >
                  {project.status}
                </Badge>
                <div className="text-sm text-primary-foreground/70">
                  ID: {project._id?.slice(-12)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <div className="flex space-x-1 bg-card p-1 rounded-lg shadow-sm border">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="lg"
              onClick={() => setActiveTab("overview")}
              className="px-6"
            >
              <Activity className="mr-2 h-5 w-5" /> Overview
            </Button>
            <Button
              variant={activeTab === "participants" ? "default" : "ghost"}
              size="lg"
              onClick={() => setActiveTab("participants")}
              className="px-6"
            >
              <Users className="mr-2 h-5 w-5" /> Participants
              <Badge variant="secondary" className="ml-2">
                {project.participants?.length || 0}
              </Badge>
            </Button>
          </div>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}
