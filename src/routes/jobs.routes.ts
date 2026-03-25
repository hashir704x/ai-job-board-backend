import { Hono } from "hono";
import {
  getAllJobsForOrganization,
  getJobById,
} from "../controllers/job.controller";

const jobsRoutes = new Hono();

jobsRoutes.get("/get-organization-jobs", getAllJobsForOrganization);
jobsRoutes.get("/get-job-by-id/:job-id", getJobById);

export { jobsRoutes };
