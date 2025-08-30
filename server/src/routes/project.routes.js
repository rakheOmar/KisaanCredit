import { Router } from "express";
import {
  createProject,
  getProjectById,
  updateProjectDetails,
  addParticipantToProject,
  removeParticipantFromProject,
  getDeveloperProjects,
  getParticipantProjects,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createProject);
router.get("/", getDeveloperProjects);
router.get("/farmer", getParticipantProjects);
router.get("/:projectId", getProjectById);
router.patch("/:projectId", updateProjectDetails);
router.post("/:projectId/participants", addParticipantToProject);
router.delete("/:projectId/participants/:participantId", removeParticipantFromProject);

export default router;
