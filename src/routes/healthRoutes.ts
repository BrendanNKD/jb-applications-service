import { Elysia } from "elysia";

export const healthRoutes = (app: Elysia) => {
  app.get("/health", () => {
    return { status: "ok" };
  });
};
