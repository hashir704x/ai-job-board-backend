import { Hono } from "hono";
import { auth } from "./lib/auth";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { jobsRoutes } from "./routes/jobs.routes";

const app = new Hono();
app.use(logger());

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not set in the .env file");
}

app.use(
  "/api/*",
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/jobs", jobsRoutes);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
