// controllers/jobApplicationController.ts
import mongoose from "mongoose";
import { JobApplication, type IJobApplication } from "../models/applications";

interface ControllerResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

// GET all job applications with resume transformed to include only the filename.
export const getAllJobApplications = async (): Promise<ControllerResult> => {
    try {
      const applications = await JobApplication.find();
  
      const transformedApplications = applications.map((app) => {
        const appObj = app.toObject();
        if (appObj.resume) {
          // Cast to "any" to suppress the type error.
          appObj.resume = { filename: appObj.resume.filename } as any;
        }
        return appObj;
      });
  
      return { success: true, data: transformedApplications };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // GET a job application by ID with resume transformed.
export const getJobApplicationById = async (
  id: string
): Promise<ControllerResult> => {
  try {
    const application = await JobApplication.findById(id);
    if (!application) {
      return { success: false, error: "Job application not found", status: 404 };
    }
    const appObj = application.toObject();
    if (appObj.resume) {
      appObj.resume = { filename: appObj.resume.filename } as any;
    }
    return { success: true, data: appObj };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

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
    return { success: true, data: transformedApplications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update only the status field of a job application.
export const updateJobApplicationStatus = async (
  id: string,
  newStatus: "pending" | "reviewed" | "accepted" | "rejected"
): Promise<ControllerResult> => {
  try {
    // Update the status and optionally record an update timestamp.
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      id,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedApplication) {
      return { success: false, error: "Job application not found", status: 404 };
    }
    // Transform the resume field if it exists.
    const appObj = updatedApplication.toObject();
    if (appObj.resume) {
      appObj.resume = { filename: appObj.resume.filename } as any;
    }
    return { success: true, data: appObj };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};


// CREATE a new job application remains largely unchanged.
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
        filename: "", // Optionally, you can set a default or extract a filename from another source.
      };
      delete payload.resumeBase64;
    }

    const newApplication = new JobApplication(payload);
    const savedApplication = await newApplication.save();
    return { success: true, data: savedApplication };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
