// src/__tests__/jobApplicationController.test.ts
import { test, describe, expect, mock, beforeEach } from "bun:test";

// 1) Stub out ControllerResultFactory
mock.module("../factories/controllerResultFactory", () => ({
  __esModule: true,
  default: {
    success: (data: any, status?: number) => ({
      success: true,
      data,
      ...(status !== undefined ? { status } : {}),
    }),
    notFound: (message: string) => ({
      success: false,
      error: message,
      status: 404,
    }),
    fromError: (err: Error) => ({
      success: false,
      error: err.message,
    }),
  },
}));

// 2) Create a mock JobApplication class
class JobApplicationMock {
  payload: any;
  constructor(payload: any) {
    this.payload = payload;
  }
  save = mock<() => Promise<any>>();
  toObject() {
    // not used in create; only static methods return objects with toObject
    return this.payload;
  }
  static find = mock<(...args: any[]) => Promise<any[]>>();
  static findById = mock<(...args: any[]) => Promise<any>>();
  static findByIdAndUpdate = mock<(...args: any[]) => Promise<any>>();
}
mock.module("../models/applications", () => ({
  __esModule: true,
  JobApplication: JobApplicationMock,
}));

// 3) Import the controller under test
import {
  getAllJobApplications,
  getJobApplicationById,
  getJobApplicationsByJobId,
  getJobApplicationsByCreatedBy,
  updateJobApplicationStatus,
  createJobApplication,
} from "../controllers/jobApplicationController";

describe("jobApplicationController", () => {
  //
  // getAllJobApplications
  //
  test("getAllJobApplications → transforms resumes and returns success", async () => {
    const docs = [
      { toObject: () => ({ resume: { filename: "r1.pdf", extra: "x" }, foo: 1 }) },
      { toObject: () => ({ foo: 2 }) },
    ];
    (JobApplicationMock.find as any).mockResolvedValue(docs);

    const res = await getAllJobApplications();
    expect(res).toEqual({
      success: true,
      data: [
        { resume: { filename: "r1.pdf" }, foo: 1 },
        { foo: 2 },
      ],
    });
  });

  test("getAllJobApplications → returns error on exception", async () => {
    (JobApplicationMock.find as any).mockRejectedValue(new Error("failAll"));

    const res = await getAllJobApplications();
    expect(res).toEqual({ success: false, error: "failAll" });
  });

  //
  // getJobApplicationById
  //
  test("getJobApplicationById → success + transform", async () => {
    const doc = { toObject: () => ({ resume: { filename: "r2.pdf" }, bar: 3 }) };
    (JobApplicationMock.findById as any).mockResolvedValue(doc);

    const res = await getJobApplicationById("id1");
    expect(res).toEqual({
      success: true,
      data: { resume: { filename: "r2.pdf" }, bar: 3 },
    });
  });

  test("getJobApplicationById → not found", async () => {
    (JobApplicationMock.findById as any).mockResolvedValue(null);

    const res = await getJobApplicationById("id2");
    expect(res).toEqual({
      success: false,
      error: "Job application not found",
      status: 404,
    });
  });

  test("getJobApplicationById → error", async () => {
    (JobApplicationMock.findById as any).mockRejectedValue(new Error("errById"));

    const res = await getJobApplicationById("id3");
    expect(res).toEqual({ success: false, error: "errById" });
  });

  //
  // getJobApplicationsByJobId
  //
  test("getJobApplicationsByJobId → success + transform", async () => {
    const docs = [
      { toObject: () => ({ resume: { filename: "r3.pdf" }, a: 4 }) },
    ];
    (JobApplicationMock.find as any).mockResolvedValue(docs);

    const res = await getJobApplicationsByJobId("job1");
    expect(res).toEqual({
      success: true,
      data: [{ resume: { filename: "r3.pdf" }, a: 4 }],
    });
  });

  test("getJobApplicationsByJobId → error", async () => {
    (JobApplicationMock.find as any).mockRejectedValue(new Error("errByJob"));

    const res = await getJobApplicationsByJobId("job2");
    expect(res).toEqual({ success: false, error: "errByJob" });
  });

  //
  // getJobApplicationsByCreatedBy
  //
  test("getJobApplicationsByCreatedBy → success + transform", async () => {
    const docs = [
      { toObject: () => ({ resume: { filename: "r4.pdf" }, b: 5 }) },
    ];
    (JobApplicationMock.find as any).mockResolvedValue(docs);

    const res = await getJobApplicationsByCreatedBy("user1");
    expect(res).toEqual({
      success: true,
      data: [{ resume: { filename: "r4.pdf" }, b: 5 }],
    });
  });

  test("getJobApplicationsByCreatedBy → error", async () => {
    (JobApplicationMock.find as any).mockRejectedValue(new Error("errByUser"));

    const res = await getJobApplicationsByCreatedBy("user2");
    expect(res).toEqual({ success: false, error: "errByUser" });
  });

  //
  // updateJobApplicationStatus
  //
  test("updateJobApplicationStatus → success + transform", async () => {
    const doc = { toObject: () => ({ resume: { filename: "r5.pdf" }, c: 6 }) };
    (JobApplicationMock.findByIdAndUpdate as any).mockResolvedValue(doc);

    const res = await updateJobApplicationStatus("id4", "accepted");
    expect(res).toEqual({
      success: true,
      data: { resume: { filename: "r5.pdf" }, c: 6 },
    });
  });

  test("updateJobApplicationStatus → not found", async () => {
    (JobApplicationMock.findByIdAndUpdate as any).mockResolvedValue(null);

    const res = await updateJobApplicationStatus("id5", "rejected");
    expect(res).toEqual({
      success: false,
      error: "Job application not found",
      status: 404,
    });
  });

  test("updateJobApplicationStatus → error", async () => {
    (JobApplicationMock.findByIdAndUpdate as any).mockRejectedValue(
      new Error("errUpdate")
    );

    const res = await updateJobApplicationStatus("id6", "pending");
    expect(res).toEqual({ success: false, error: "errUpdate" });
  });

});
