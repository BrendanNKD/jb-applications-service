// controllers/jobApplicationController.ts
import mongoose from "mongoose";
import { JobApplication, type IJobApplication } from "../models/applications";
import ControllerResultFactory from "../factories/controllerResultFactory";

// GET all job applications with resume transformed to include only the filename.

interface ControllerResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  metadata?: Record<string, any>;
}


export const getAllJobApplications = async (): Promise<ControllerResult> => {
  try {
    const applications = await JobApplication.find();

    const transformedApplications = applications.map((app) => {
      const appObj = app.toObject();
      if (appObj.resume) {
        appObj.resume = { filename: appObj.resume.filename } as any;
      }
      return appObj;
    });

    return ControllerResultFactory.success(transformedApplications);
  } catch (error: any) {
    return ControllerResultFactory.fromError(error);
  }
};

// GET a job application by ID with resume transformed.
export const getJobApplicationById = async (
  id: string
): Promise<ControllerResult> => {
  try {
    const application = await JobApplication.findById(id);
    if (!application) {
      return ControllerResultFactory.notFound("Job application not found");
    }
    const appObj = application.toObject();
    if (appObj.resume) {
      appObj.resume = { filename: appObj.resume.filename } as any;
    }
    return ControllerResultFactory.success(appObj);
  } catch (error: any) {
    return ControllerResultFactory.fromError(error);
  }
};

export const getJobApplicationsByJobId = async (
  jobId: string
): Promise<ControllerResult> => {
  try {
    const applications = await JobApplication.find({ job: jobId });

    const data = applications.map((app) => {
      const obj = app.toObject();
      if (obj.resume) {
        obj.resume = { filename: obj.resume.filename } as any;
      }
      return obj;
    });

    return ControllerResultFactory.success(data);
  } catch (error: any) {
    return ControllerResultFactory.fromError(error);
  }
}

// GET job applications by createdBy with resume transformed.
export const getJobApplicationsByCreatedBy = async (
  createdBy: string
): Promise<ControllerResult> => {
  try {
    const applications = await JobApplication.find({ createdBy });
    const transformedApplications = applications.map((app) => {
      const appObj = app.toObject();
      if (appObj.resume) {
        appObj.resume = { filename: appObj.resume.filename } as any;
      }
      return appObj;
    });
    return ControllerResultFactory.success(transformedApplications);
  } catch (error: any) {
    return ControllerResultFactory.fromError(error);
  }
};

// Update only the status field of a job application.
export const updateJobApplicationStatus = async (
  id: string,
  newStatus: "pending" | "reviewed" | "accepted" | "rejected"
): Promise<ControllerResult> => {
  try {
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      id,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedApplication) {
      return ControllerResultFactory.notFound("Job application not found");
    }
    const appObj = updatedApplication.toObject();
    if (appObj.resume) {
      appObj.resume = { filename: appObj.resume.filename } as any;
    }
    return ControllerResultFactory.success(appObj);
  } catch (error: any) {
    return ControllerResultFactory.fromError(error);
  }
};

// CREATE a new job application
export const createJobApplication = async (
  payload: Partial<IJobApplication> & { resumeBase64?: string }
): Promise<ControllerResult> => {
  try {
    if (payload.job && typeof payload.job === "string") {
      payload.job = new mongoose.Types.ObjectId(String(payload.job));
    }

    if (payload.resumeBase64) {
      payload.resume = {
        data: Buffer.from(payload.resumeBase64, "base64"),
        contentType: "application/pdf",
        filename: "",
      };
      delete payload.resumeBase64;
    }

    const newApplication = new JobApplication(payload);
    const savedApplication = await newApplication.save();
    return ControllerResultFactory.success(savedApplication, 201);
  } catch (error: any) {
    return ControllerResultFactory.fromError(error);
  }
};