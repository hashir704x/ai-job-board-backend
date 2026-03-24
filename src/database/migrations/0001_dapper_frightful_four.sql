CREATE TYPE "public"."user_roles_enum" AS ENUM('employer', 'applicant');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "userRole" "user_roles_enum" NOT NULL;