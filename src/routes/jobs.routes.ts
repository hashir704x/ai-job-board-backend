import { Hono } from "hono";
import {
  getAllJobsForOrganization,
  getJobById,
  createJob,
  updateJob,
} from "../controllers/job.controller";

const jobsRoutes = new Hono();

jobsRoutes.get("/get-organization-jobs", getAllJobsForOrganization);
jobsRoutes.post("/create-job", createJob);
jobsRoutes.get("/get-job-by-id/:jobId", getJobById);
jobsRoutes.put("/update-job/:jobId", updateJob);

export { jobsRoutes };
