// routes/jobApplicationRoutes.ts
import { Elysia } from "elysia";
import mongoose from "mongoose";
import { createJobApplication, getAllJobApplications } from "../controllers/jobApplicationController";

export const jobApplicationRoutes = (app: Elysia) => {
  // GET all job applications (transforms resume to only return filename)
  app.get("/v1/api/", async () => {
    const result = await getAllJobApplications();
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status || 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  // CREATE a new job application using multipart/form-data
  app.post("/v1/api/", async ({ request }) => {
    try {
      const formData = await request.formData();

      // Extract required fields.
      const job = formData.get("job");
      const applicantName = formData.get("applicantName");
      const email = formData.get("email");

      if (!job || !applicantName || !email) {
        return new Response(JSON.stringify({ error: "Missing required fields." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Optionally extract coverLetter.
      const coverLetter = formData.get("coverLetter") || "";

      // Get the resume file (assumed to be sent in a field named "resume").
      const resumeFile = formData.get("resume") as File;
      if (!resumeFile) {
        return new Response(JSON.stringify({ error: "Resume file is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Convert the resume file to a Buffer.
      const arrayBuffer = await resumeFile.arrayBuffer();
      const resumeBuffer = Buffer.from(arrayBuffer);

      // Build the payload, including the filename.
      const payload = {
        job: new mongoose.Types.ObjectId(job.toString()),
        applicantName: applicantName.toString(),
        email: email.toString(),
        coverLetter: coverLetter.toString(),
        resume: {
          data: resumeBuffer,
          contentType: resumeFile.type || "application/pdf",
          filename: resumeFile.name, // <-- Storing the filename
        },
      };

      const result = await createJobApplication(payload);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status || 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result.data), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  });

  // DOWNLOAD resume by application ID
  app.get("/v1/api/resume/:id", async ({ params }) => {
    console.log(params)
    try {
      const application = await import("../models/applications").then(m => m.JobApplication).then(JobApplication => JobApplication.findById(params.id));
      if (!application || !application.resume || !application.resume.data) {
        return new Response(JSON.stringify({ error: "Resume not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(application.resume.data, {
        status: 200,
        headers: {
          "Content-Type": application.resume.contentType,
          "Content-Disposition": `attachment; filename="${application.resume.filename}"`,
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  });
};
