import { Context } from "hono";
import { jobListingTable } from "../database/schema";
import { db } from "../database/db";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "../lib/auth";

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
    const { id } = c.req.param();
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
          eq(jobListingTable.id, id),
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
