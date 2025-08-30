import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!project) return <div className="text-center mt-10">Project not found</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <Toaster position="top-center" richColors />
      <Card className="shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle>{project.projectName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Project Type:</strong> {project.projectType}
          </div>
          <div>
            <strong>Carbon Standard:</strong> {project.carbonStandard}
          </div>
          <div>
            <strong>Methodology:</strong> {project.methodology}
          </div>
          <div>
            <strong>Status:</strong> {project.status}
          </div>

          <div>
            <strong>Location:</strong> {project.location?.state}, {project.location?.district}
          </div>

          <div>
            <strong>Crediting Period:</strong>{" "}
            {new Date(project.creditingPeriod?.startDate).toLocaleDateString()} -{" "}
            {new Date(project.creditingPeriod?.endDate).toLocaleDateString()}
          </div>

          <div>
            <strong>Project Developer:</strong>{" "}
            {project.projectDeveloper ? (
              <div className="flex items-center gap-2 mt-1">
                {project.projectDeveloper.avatar && (
                  <img
                    src={project.projectDeveloper.avatar}
                    alt="Developer Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{project.projectDeveloper._id}</span>
              </div>
            ) : (
              "Not assigned"
            )}
          </div>

          <div>
            <strong>Participants:</strong>{" "}
            {Array.isArray(project.participants) && project.participants.length > 0
              ? project.participants.join(", ")
              : "No participants yet"}
          </div>

          <div>
            <strong>Documentation:</strong>{" "}
            {Array.isArray(project.documentation) && project.documentation.length > 0
              ? project.documentation.join(", ")
              : "No documents yet"}
          </div>

          <div>
            <strong>Created At:</strong> {new Date(project.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Updated At:</strong> {new Date(project.updatedAt).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
