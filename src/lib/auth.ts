import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database/db";
import * as schema from "../database/schema";
import { organization } from "better-auth/plugins";
import { userNotificationSettingTable } from "../database/schema";

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not set in the .env file");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  user: {
    additionalFields: {
      userRole: { type: "string", required: true, input: true },
    },
  },

  emailAndPassword: { enabled: true },
  plugins: [organization({ allowUserToCreateOrganization: true })],

  advanced: {
    cookiePrefix: "job-board",
    useSecureCookies: true,
    defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true },
  },
  trustedOrigins: [process.env.FRONTEND_URL],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db
            .insert(userNotificationSettingTable)
            .values({ userId: user.id });
        },
      },
    },
  },
});
