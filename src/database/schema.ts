import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  uuid,
  integer,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

// --- ENUMS ---
export const wageIntervalEnum = pgEnum("wage_interval", ["hourly", "yearly"]);
export const locationRequirementEnum = pgEnum("location_requirement", [
  "in-office",
  "hybrid",
  "remote",
]);
export const experienceLevelEnum = pgEnum("experience_level", [
  "junior",
  "senior",
  "mid-level",
]);
export const jobListingStatusEnum = pgEnum("job_listing_status", [
  "draft",
  "delisted",
  "published",
]);
export const jobListingTypeEnum = pgEnum("job_listing_type", [
  "internship",
  "part-time",
  "full-time",
]);
export const applicationStageEnum = pgEnum("application_stage", [
  "applied",
  "denied",
  "interested",
  "interviewed",
  "hired",
]);
// --- TABLES ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});


export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_org_idx").on(table.organizationId),
    index("member_user_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_org_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const jobListingTable = pgTable(
  "job_listing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    wage: integer("wage"),
    wageInterval: wageIntervalEnum("wage_interval"),
    stateAbbreviation: text("state_abbreviation"),
    city: text("city"),
    isFeatured: boolean("is_featured").notNull().default(false),
    locationRequirement: locationRequirementEnum(
      "location_requirement",
    ).notNull(),
    status: jobListingStatusEnum("status").notNull().default("draft"),
    type: jobListingTypeEnum("type"),
    experienceLevel: experienceLevelEnum("experience_level").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("job_state_idx").on(table.stateAbbreviation)],
);

export const jobListingApplicationTable = pgTable(
  "job_listing_application",
  {
    jobListingId: uuid("job_listing_id")
      .notNull()
      .references(() => jobListingTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter"),
    rating: integer("rating"),
    stage: applicationStageEnum("stage").notNull().default("applied"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.jobListingId, table.userId] })],
);

export const organizationUserSettingTable = pgTable(
  "organization_user_setting",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    newApplicationEmailNotifications: boolean("new_app_email_notif")
      .notNull()
      .default(false),
    minimumRating: integer("minimum_rating"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.organizationId] })],
);

export const userNotificationSettingTable = pgTable(
  "user_notification_setting",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    newJobEmailNotifications: boolean("new_job_email_notif")
      .notNull()
      .default(false),
    aiPrompt: text("ai_prompt"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);

export const userResumeTable = pgTable("user_resume", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  resumeFileUrl: text("resume_file_url").notNull(),
  resumeFileKey: text("resume_file_key").notNull(),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// --- RELATIONS ---

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  applications: many(jobListingApplicationTable),
  notificationSettings: one(userNotificationSettingTable, {
    fields: [user.id],
    references: [userNotificationSettingTable.userId],
  }),
  resume: one(userResumeTable, {
    fields: [user.id],
    references: [userResumeTable.userId],
  }),
  organizationUserSettings: many(organizationUserSettingTable),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  jobListings: many(jobListingTable),
  userSettings: many(organizationUserSettingTable),
}));

export const jobListingTableRelations = relations(
  jobListingTable,
  ({ many, one }) => ({
    organization: one(organization, {
      fields: [jobListingTable.organizationId],
      references: [organization.id],
    }),
    applications: many(jobListingApplicationTable),
  }),
);

export const jobListingApplicationTableRelations = relations(
  jobListingApplicationTable,
  ({ one }) => ({
    jobListing: one(jobListingTable, {
      fields: [jobListingApplicationTable.jobListingId],
      references: [jobListingTable.id],
    }),
    user: one(user, {
      fields: [jobListingApplicationTable.userId],
      references: [user.id],
    }),
  }),
);

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
