import z from "zod";

export const createJobSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10), // This will be your MDX/Markdown string
  wage: z.number().optional(),
  wageInterval: z.enum(["hourly", "yearly"]).optional(),
//   city: z.string().optional(),
//   stateAbbreviation: z.string().max(2).optional(),
  locationRequirement: z.enum(["in-office", "hybrid", "remote"]),
  type: z.enum(["internship", "part-time", "full-time"]),
  experienceLevel: z.enum(["junior", "mid-level", "senior"]),
});

export const updateJobSchema = createJobSchema.partial();