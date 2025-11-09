import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const jobs = sqliteTable("jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  url: text("url").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  jobType: text("job_type", {
    enum: [
      "discover-programs",
      "discover-courses",
      "discover-course-offerings",
      "program",
      "course",
      "course-offering",
    ],
  }).notNull(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const errorLogs = sqliteTable("error_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  jobId: text("job_id").references(() => jobs.id),
  errorType: text("error_type", {
    enum: ["network", "parsing", "validation", "timeout", "unknown"],
  }).notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});
