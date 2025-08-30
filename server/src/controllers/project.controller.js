import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createProject = asyncHandler(async (req, res) => {
  const {
    projectName,
    projectType,
    location,
    geoJson,
    carbonStandard,
    methodology,
    creditingPeriodStart,
    creditingPeriodEnd,
  } = req.body;

  if (!projectName || !projectType || !location || !creditingPeriodStart || !creditingPeriodEnd) {
    throw new ApiError(400, "Please provide all required project fields");
  }

  if (req.user.role !== "Project Developer") {
    throw new ApiError(403, "Only Project Developers can create new projects");
  }

  const project = await Project.create({
    projectName,
    projectDeveloper: req.user._id,
    projectType,
    location,
    geoJson,
    carbonStandard,
    methodology,
    creditingPeriod: {
      start: creditingPeriodStart,
      end: creditingPeriodEnd,
    },
  });

  if (!project) {
    throw new ApiError(500, "Failed to create the project");
  }

  return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid Project ID");
  }

  const project = await Project.findById(projectId)
    .populate("projectDeveloper", "username fullName avatar")
    .populate("participants", "username fullName avatar");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res.status(200).json(new ApiResponse(200, project, "Project fetched successfully"));
});

const updateProjectDetails = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { ...updateData } = req.body;

  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError(400, "Invalid Project ID");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.projectDeveloper.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this project");
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

const addParticipantToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { participantId } = req.body;

  if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(participantId)) {
    throw new ApiError(400, "Invalid Project or Participant ID");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.projectDeveloper.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to manage participants for this project");
  }

  const participant = await User.findById(participantId);
  if (!participant || participant.role !== "Farmer") {
    throw new ApiError(404, "Farmer participant not found");
  }

  if (project.participants.includes(participantId)) {
    throw new ApiError(409, "This farmer is already a participant in the project");
  }

  project.participants.push(participantId);
  await project.save();

  return res.status(200).json(new ApiResponse(200, project, "Participant added successfully"));
});

const removeParticipantFromProject = asyncHandler(async (req, res) => {
  const { projectId, participantId } = req.params;

  if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(participantId)) {
    throw new ApiError(400, "Invalid Project or Participant ID");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.projectDeveloper.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to manage participants for this project");
  }

  await Project.findByIdAndUpdate(projectId, {
    $pull: { participants: participantId },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Participant removed successfully"));
});

const getDeveloperProjects = asyncHandler(async (req, res) => {
  if (req.user.role !== "Project Developer") {
    throw new ApiError(403, "Access denied");
  }

  const projects = await Project.find({ projectDeveloper: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Developer's projects fetched successfully"));
});

const getParticipantProjects = asyncHandler(async (req, res) => {
  if (req.user.role !== "Farmer") {
    throw new ApiError(403, "Access denied");
  }

  const projects = await Project.find({ participants: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Farmer's enrolled projects fetched successfully"));
});

export {
  createProject,
  getProjectById,
  updateProjectDetails,
  addParticipantToProject,
  removeParticipantFromProject,
  getDeveloperProjects,
  getParticipantProjects,
};
