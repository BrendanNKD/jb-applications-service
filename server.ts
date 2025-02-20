import { Elysia } from "elysia";
import { connectDB } from "./src/database/mongo";
import { jobApplicationRoutes } from "./src/routes/jobApplicationsRoutes";

import { healthRoutes } from "./src/routes/healthRoutes";

const app = new Elysia();

// Register the health routes without protection.
healthRoutes(app);

// Apply guard only for the job listing routes.
app.guard(
  {
    // The guard checks the session cookie before handling the request.
    async beforeHandle({ headers, request, error }) {
      console.log("Requested URL:", request.url);
      // Extract the Bearer token from the Authorization header (case-insensitive)
      const authHeader = headers["Authorization"] || headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return error(401, "Missing or invalid token");
      }

      // Remove the "Bearer " prefix to get the token
      const token = authHeader.substring("Bearer ".length);

      try {
        // Call your authentication endpoint (which returns JSON with properties: valid, message, username, role)
        const res = await fetch("http://localhost:8080/authenticate", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          return error(res.status);
        }

        const authData = await res.json();

        if (!authData.valid) {
          return error(401, authData.message);
        }
      } catch (err) {
        return error(500, "Error verifying token");
      }
    },
  },
  (guardedApp) => {
    // Only job listing routes are protected by this guard.
    jobApplicationRoutes(guardedApp as unknown as Elysia<any>);
    return guardedApp;
  }
);

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});

await connectDB();
