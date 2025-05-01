// routes/jobApplicationRoutes.ts
import { Elysia } from "elysia";
import mongoose from "mongoose";
import { createJobApplication, getAllJobApplications, getJobApplicationById, getJobApplicationsByCreatedBy, getJobApplicationsByJobId, updateJobApplicationStatus } from "../controllers/jobApplicationController";

export const jobApplicationRoutes = (app: Elysia) => {
  // GET all job applications (transforms resume to only return filename)
  // Existing endpoint to get all job applications
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

  // New endpoint to get a job application by ID
  app.get("/v1/api/:id", async ({ params, store }) => {
    const result = await getJobApplicationById(params.id);
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

    // New endpoint to list all applications for a specific job
    app.get("/v1/api/job/:jobId", async ({ params }) => {
      const result = await getJobApplicationsByJobId(params.jobId);
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

  // New endpoint to get all job applications created by the authenticated user
  app.get("/v1/api/created", async ({ store }) => {

    if ((store as any).role !== "jobseeker") {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // We assume the authentication guard sets store.username.
    const username = (store as any).username;
    const result = await getJobApplicationsByCreatedBy(username);
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
  app.post("/v1/api/", async ({ request, store }) => {
    // Check if the user has the "employer" role
    console.log((store as any).role)
    if ((store as any).role !== "jobseeker") {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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
  app.get("/v1/api/resume/:id", async ({ params, store }) => {

    if ((store as any).role !== "employer") {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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

// Endpoint to update the status of a job application
app.patch("/v1/api/:id/status", async ({ params, request, store }) => {
  // Extract the current user's username from store.
  const currentUsername = (store as any).username;

  // Get the new status from the request body.
  const { status: newStatus } = await request.json();

  // Validate that the newStatus is one of the allowed values.
  const allowedStatuses = ["pending", "reviewed", "accepted", "rejected"];
  if (!allowedStatuses.includes(newStatus)) {
    return new Response(JSON.stringify({ error: "Invalid status value" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // (Optional) Fetch the application to check if the current user is authorized
  const appResult = await getJobApplicationById(params.id);
  if (!appResult.success) {
    return new Response(JSON.stringify({ error: appResult.error }), {
      status: appResult.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // For protection, verify that the current user is allowed to update this application.
  // For example, if the application has a "createdBy" field, ensure it matches the current username.

  // Now, update the status of the job application.
  const result = await updateJobApplicationStatus(params.id, newStatus);
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


};


