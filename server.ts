import { Elysia } from "elysia";
import { connectDB } from "./src/database/mongo";
import { jobApplicationRoutes } from "./src/routes/jobApplicationsRoutes";
import { healthRoutes } from "./src/routes/healthRoutes";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import dotenv from 'dotenv';
import cors from "@elysiajs/cors";

/**
 * Loads production secrets from AWS Secrets Manager.
 * The secret should be a JSON string containing keys:
 * MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOST, and MONGO_DB.
 */
async function loadProdSecrets() {

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "ap-southeast-1", credentials: defaultProvider() });
  const command = new GetSecretValueCommand({ SecretId: 'prod/mongo' });
  const response = await client.send(command);
  if (!response.SecretString) {
    throw new Error("No secret string returned from AWS Secrets Manager.");
  }
  const secret = JSON.parse(response.SecretString);
  // Replace environment variables with the secret values.
  process.env.MONGO_USERNAME = secret.MONGO_USERNAME;
  process.env.MONGO_PASSWORD = secret.MONGO_PASSWORD;
  process.env.MONGO_HOST = secret.MONGO_HOST;
  process.env.MONGO_DB = secret.MONGO_DB;

      // --- new endpoints secret ---
      const endpointsCmd = new GetSecretValueCommand({ SecretId: 'prod/endpoints' });
      const endpointsResp = await client.send(endpointsCmd);
      if (!endpointsResp.SecretString) {
        throw new Error("No secret string returned for prod/endpoints.");
      }
      const endpointsSecret = JSON.parse(endpointsResp.SecretString);
      // assume your secret JSON contains a key called AUTH_BASE_URL
      if (!endpointsSecret.AUTH_BASE_URL) {
        throw new Error("prod/endpoints is missing AUTH_BASE_URL field.");
      }
      process.env.AUTH_BASE_URL = endpointsSecret.AUTH_BASE_URL;

}

async function startServer() {

  const APP_ENV = process.env.APP_ENV || 'dev';
  const APP_PORT = process.env.APP_PORT || 3000
  // In development, load local variables from .env
  if (APP_ENV === 'dev') {
    await dotenv.config();
  }

  // For production, load secrets from AWS before starting the server.
  console.log("Environment:" + APP_ENV)
  if (APP_ENV === 'prod') {
    await loadProdSecrets();
  }

  const app = new Elysia();
 
  app.use(
    cors({
      origin: '*',                        // allow all origins
      methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
      allowedHeaders: ['Content-Type','Authorization'], // allow your token header
      credentials: false                  // default; no cookies or HTTP auth
    })
  )
  .state({username: "", role: ""})

  // Register the health routes without protection.
  healthRoutes(app);

  // Apply guard only for the job listing routes.
  app.guard(
    {
      async beforeHandle({ headers, request, error, store }) {
        console.log("Requested URL:", request.url);
        // Extract the Bearer token from the Authorization header (case-insensitive)
        const authHeader = headers["Authorization"] || headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return error(401, "Missing or invalid token");
        }
        // Remove the "Bearer " prefix to get the token
        const token = authHeader.substring("Bearer ".length);
        try {
          // Call your authentication endpoint.
          const res = await fetch(process.env.AUTH_BASE_URL+ "/authenticate", {
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

          (store as any).username = authData.username;
          (store as any).role = authData.role;


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

  app.listen(APP_PORT, () => {
    console.log("Server running on http://localhost:3001");
  });

  // Connect to MongoDB after starting the server.
  await connectDB();
}

startServer().catch(console.error);
