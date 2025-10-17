import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Main Workspace"),
  data: jsonb("data")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const courseFiles = pgTable("course_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const courseTopics = pgTable("course_topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  label: text("label").notNull(),
  weeks: integer("weeks").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const graphHistory = pgTable("graph_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expression: text("expression").notNull(),
  variables: jsonb("variables")
    .$type<Record<string, number>>()
    .default({}),
  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .default({}),
  renderedAt: timestamp("rendered_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const preferences = pgTable("preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("system"),
  notificationsEnabled: boolean("notifications_enabled")
    .default(true)
    .notNull(),
  calcMode: text("calc_mode").default("symbolic"),
  extras: jsonb("extras")
    .$type<Record<string, unknown>>()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  workspaces: many(workspaces),
  courses: many(courses),
  graphHistory: many(graphHistory),
  courseFiles: many(courseFiles),
  preferences: one(preferences),
}));

export const workspacesRelations = relations(workspaces, ({ one }) => ({
  owner: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  owner: one(users, {
    fields: [courses.userId],
    references: [users.id],
  }),
  topics: many(courseTopics),
}));

export const courseFilesRelations = relations(courseFiles, ({ one }) => ({
  owner: one(users, {
    fields: [courseFiles.userId],
    references: [users.id],
  }),
}));

export const courseTopicsRelations = relations(courseTopics, ({ one }) => ({
  course: one(courses, {
    fields: [courseTopics.courseId],
    references: [courses.id],
  }),
}));

export const graphHistoryRelations = relations(graphHistory, ({ one }) => ({
  owner: one(users, {
    fields: [graphHistory.userId],
    references: [users.id],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  owner: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
}));

export type UserRow = typeof users.$inferSelect;
export type WorkspaceRow = typeof workspaces.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type CourseFileRow = typeof courseFiles.$inferSelect;
export type CourseTopicRow = typeof courseTopics.$inferSelect;
export type GraphHistoryRow = typeof graphHistory.$inferSelect;
export type PreferenceRow = typeof preferences.$inferSelect;
