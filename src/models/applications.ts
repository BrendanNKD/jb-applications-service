// models/applications.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IJobApplication extends Document {
  job: mongoose.Types.ObjectId;
  applicantName: string;
  email: string;
  resume?: {
    data: Buffer;
    contentType: string;
    filename: string; // <-- New field
  };
  coverLetter?: string;
  appliedAt: Date;
  status: "pending" | "reviewed" | "accepted" | "rejected";
}

const jobApplicationSchema: Schema<IJobApplication> = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: "JobListing",
    required: true,
  },
  applicantName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  resume: {
    data: {
      type: Buffer,
    },
    contentType: {
      type: String,
      default: "application/pdf",
    },
    filename: { // <-- New field
      type: String,
    },
  },
  coverLetter: {
    type: String,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "accepted", "rejected"],
    default: "pending",
  },
});

export const JobApplication = mongoose.model<IJobApplication>(
  "JobApplication",
  jobApplicationSchema
);
