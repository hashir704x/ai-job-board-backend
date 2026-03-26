import { Context } from "hono";
import { jobListingTable } from "../database/schema";
import { db } from "../database/db";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "../lib/auth";
import { createJobSchema, updateJobSchema } from "../validators/validators";
import { ZodError } from "zod";

export async function getAllJobsForOrganization(c: Context) {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const activeOrgId = session?.session.activeOrganizationId;
    if (!activeOrgId) {
      return c.json(
        { success: false, error: "No active organization found" },
        401,
      );
    }

    const jobs = await db
      .select({
        id: jobListingTable.id,
        title: jobListingTable.title,
        type: jobListingTable.type,
        status: jobListingTable.status,
        createdAt: jobListingTable.createdAt,
      })
      .from(jobListingTable)
      .where(eq(jobListingTable.organizationId, activeOrgId))
      .orderBy(desc(jobListingTable.createdAt));
    return c.json({ success: true, data: jobs });
  } catch (error) {
    return c.json({ success: false, error: "Something went wrong" }, 500);
  }
}

export async function getJobById(c: Context) {
  try {
    const { jobId } = c.req.param();
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    const activeOrgId = session?.session.activeOrganizationId;

    if (!activeOrgId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const job = await db
      .select()
      .from(jobListingTable)
      .where(
        and(
          eq(jobListingTable.id, jobId),
          eq(jobListingTable.organizationId, activeOrgId),
        ),
      )
      .limit(1);

    if (!job.length)
      return c.json({ error: "Job not found", success: false }, 404);

    return c.json({ success: true, data: job[0] });
  } catch (error) {
    return c.json({ success: false, error: "Something went wrong" }, 500);
  }
}

export async function createJob(c: Context) {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const activeOrgId = session?.session.activeOrganizationId;

    if (!activeOrgId) {
      return c.json(
        { success: false, error: "Must be in an organization to post a job" },
        401,
      );
    }

    const body = await c.req.json();

    const validatedData = createJobSchema.parse(body);

    const [newJob] = await db
      .insert(jobListingTable)
      .values({
        ...validatedData,
        organizationId: activeOrgId, // Automatically tether to the active org
        status: "draft", // Defaulting to published for now
      })
      .returning({ id: jobListingTable.id });

    return c.json(
      {
        success: true,
        data: newJob,
        message: "Job posted successfully!",
      },
      201,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ success: false, error: error.issues[0].message }, 400);
    }
    return c.json(
      { success: false, error: "Failed to create job listing" },
      500,
    );
  }
}

export async function updateJob(c: Context) {
  try {
    const { jobId } = c.req.param();
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const activeOrgId = session?.session.activeOrganizationId;

    if (!activeOrgId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validatedData = updateJobSchema.parse(body);

    const [updatedJob] = await db
      .update(jobListingTable)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(jobListingTable.id, jobId),
          eq(jobListingTable.organizationId, activeOrgId),
        ),
      )
      .returning();

    if (!updatedJob) {
      return c.json(
        { success: false, error: "Job not found or access denied" },
        404,
      );
    }

    return c.json({
      success: true,
      data: updatedJob,
      message: "Job updated successfully!",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ success: false, error: error.issues[0].message }, 400);
    }
    console.error("Update Job Error:", error);
    return c.json({ success: false, error: "Failed to update job" }, 500);
  }
}
