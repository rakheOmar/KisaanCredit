import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createProject = asyncHandler(async (req, res) => {
  const { projectName, projectType, location, carbonStandard, methodology, creditingPeriod } =
    req.body;

  if (
    !projectName ||
    !projectType ||
    !location?.state ||
    !location?.district ||
    !creditingPeriod?.startDate ||
    !creditingPeriod?.endDate
  ) {
    throw new ApiError(400, "Please provide all required project fields");
  }

  const project = await Project.create({
    projectName,
    projectDeveloper: req.user._id,
    projectType,
    location,
    carbonStandard,
    methodology,
    creditingPeriod: {
      startDate: new Date(creditingPeriod.startDate),
      endDate: new Date(creditingPeriod.endDate),
    },
  });

  return res.status(201).json(new ApiResponse(201, "Project created successfully", project));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError("Invalid Project ID", 400);
  }

  const project = await Project.findById(projectId)
    .populate("projectDeveloper", "username fullName avatar")
    .populate("participants", "username fullName avatar");

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  return res.status(200).json(new ApiResponse(200, "Project fetched successfully", project));
});

const updateProjectDetails = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const updateData = req.body;

  if (!mongoose.isValidObjectId(projectId)) {
    throw new ApiError("Invalid Project ID", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (project.projectDeveloper.toString() !== req.user._id.toString()) {
    throw new ApiError("You are not authorized to update this project", 403);
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, "Project updated successfully", updatedProject));
});

const addParticipantToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { participantId } = req.body;

  if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(participantId)) {
    throw new ApiError("Invalid Project or Participant ID", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (project.projectDeveloper.toString() !== req.user._id.toString()) {
    throw new ApiError("You are not authorized to manage participants for this project", 403);
  }

  const participant = await User.findById(participantId);
  if (!participant || participant.role !== "Farmer") {
    throw new ApiError("Farmer participant not found", 404);
  }

  if (project.participants.includes(participantId)) {
    throw new ApiError("This farmer is already a participant in the project", 409);
  }

  project.participants.push(participantId);
  await project.save();

  return res.status(200).json(new ApiResponse(200, "Participant added successfully", project));
});

const removeParticipantFromProject = asyncHandler(async (req, res) => {
  const { projectId, participantId } = req.params;

  if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(participantId)) {
    throw new ApiError("Invalid Project or Participant ID", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (project.projectDeveloper.toString() !== req.user._id.toString()) {
    throw new ApiError("You are not authorized to manage participants for this project", 403);
  }

  await Project.findByIdAndUpdate(projectId, { $pull: { participants: participantId } });

  return res.status(200).json(new ApiResponse(200, "Participant removed successfully"));
});

const getDeveloperProjects = asyncHandler(async (req, res) => {
  // if (req.user.role !== "Project Developer") {
  //   throw new ApiError("Access denied", 403);
  // }

  const projects = await Project.find({ projectDeveloper: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "Developer's projects fetched successfully", projects));
});

const getParticipantProjects = asyncHandler(async (req, res) => {
  if (req.user.role !== "Farmer") {
    throw new ApiError("Access denied", 403);
  }

  const projects = await Project.find({ participants: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "Farmer's enrolled projects fetched successfully", projects));
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
