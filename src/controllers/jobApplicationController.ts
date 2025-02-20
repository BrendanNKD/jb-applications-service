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
