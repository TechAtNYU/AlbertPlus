/**
 * Database seeding mutations for AlbertPlus
 *
 * These are internal mutations that can be called from the Convex dashboard
 * or via the Convex CLI to seed the database with sample data.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { schoolName } from "./schemas/schools";

/**
 * Clear all data from all tables
 * WARNING: This will delete all data in the database
 */
export const clearAll = internalMutation({
  handler: async (ctx) => {
    console.log("🗑  Clearing all database tables...");

    // Delete in reverse dependency order to maintain referential integrity
    const tables = [
      "userCourseOfferings",
      "userCourses",
      "students",
      "courseOfferings",
      "requirements",
      "prerequisites",
      "courses",
      "programs",
      "schools",
      "appConfigs",
    ] as const;

    for (const tableName of tables) {
      console.log(`  Clearing ${tableName}...`);
      const documents = await ctx.db.query(tableName).collect();
      for (const doc of documents) {
        await ctx.db.delete(doc._id);
      }
      console.log(`  ✓ Cleared ${documents.length} records from ${tableName}`);
    }

    console.log("✅ All tables cleared successfully!");
    return { success: true, message: "All tables cleared" };
  },
});

/**
 * Seed all data from JSON files
 * This is the main seeding function that handles all tables with proper relationships
 */
export const seedAll = internalMutation({
  args: {
    appConfigs: v.array(
      v.object({
        key: v.string(),
        value: v.string(),
      }),
    ),
    schools: v.array(
      v.object({
        name: schoolName,
        shortName: v.string(),
        level: v.union(v.literal("undergraduate"), v.literal("graduate")),
      }),
    ),
    programs: v.array(
      v.object({
        name: v.string(),
        level: v.union(v.literal("undergraduate"), v.literal("graduate")),
        school: schoolName,
        programUrl: v.string(),
      }),
    ),
    courses: v.array(
      v.object({
        code: v.string(),
        program: v.string(),
        level: v.number(),
        title: v.string(),
        credits: v.number(),
        school: schoolName,
        description: v.string(),
        courseUrl: v.string(),
      }),
    ),
    courseOfferings: v.array(
      v.object({
        courseCode: v.string(),
        classNumber: v.number(),
        title: v.string(),
        section: v.string(),
        year: v.number(),
        term: v.union(
          v.literal("spring"),
          v.literal("summer"),
          v.literal("fall"),
          v.literal("j-term"),
        ),
        instructor: v.array(v.string()),
        location: v.optional(v.string()),
        days: v.array(
          v.union(
            v.literal("monday"),
            v.literal("tuesday"),
            v.literal("wednesday"),
            v.literal("thursday"),
            v.literal("friday"),
            v.literal("saturday"),
            v.literal("sunday"),
          ),
        ),
        startTime: v.string(),
        endTime: v.string(),
        status: v.union(
          v.literal("open"),
          v.literal("closed"),
          v.literal("waitlist"),
        ),
        waitlistNum: v.optional(v.number()),
        isCorequisite: v.boolean(),
        corequisiteOf: v.optional(v.number()),
      }),
    ),
    prerequisites: v.array(
      v.union(
        v.object({
          courseCode: v.string(),
          type: v.literal("required"),
          courses: v.array(v.string()),
        }),
        v.object({
          courseCode: v.string(),
          type: v.literal("alternative"),
          courses: v.array(v.string()),
        }),
        v.object({
          courseCode: v.string(),
          type: v.literal("options"),
          courses: v.array(v.string()),
          creditsRequired: v.number(),
        }),
      ),
    ),
    requirements: v.array(
      v.union(
        v.object({
          programName: v.string(),
          isMajor: v.boolean(),
          type: v.literal("required"),
          courses: v.array(v.string()),
        }),
        v.object({
          programName: v.string(),
          isMajor: v.boolean(),
          type: v.literal("alternative"),
          courses: v.array(v.string()),
        }),
        v.object({
          programName: v.string(),
          isMajor: v.boolean(),
          type: v.literal("options"),
          courses: v.array(v.string()),
          courseLevels: v.array(
            v.object({
              program: v.string(),
              level: v.number(),
            }),
          ),
          creditsRequired: v.number(),
        }),
      ),
    ),
    userCourses: v.array(
      v.object({
        userId: v.string(),
        courseCode: v.string(),
        title: v.string(),
        year: v.number(),
        term: v.union(
          v.literal("spring"),
          v.literal("summer"),
          v.literal("fall"),
          v.literal("j-term"),
        ),
        grade: v.optional(
          v.union(
            v.literal("a"),
            v.literal("a-"),
            v.literal("b+"),
            v.literal("b"),
            v.literal("b-"),
            v.literal("c+"),
            v.literal("c"),
            v.literal("c-"),
            v.literal("d+"),
            v.literal("d"),
            v.literal("p"),
            v.literal("f"),
            v.literal("w"),
          ),
        ),
      }),
    ),
    userCourseOfferings: v.array(
      v.object({
        userId: v.string(),
        classNumber: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    console.log("🌱 Starting database seeding...");

    // 1. Seed appConfigs
    console.log("📝 Seeding appConfigs...");
    for (const config of args.appConfigs) {
      const existing = await ctx.db
        .query("appConfigs")
        .withIndex("by_key", (q) => q.eq("key", config.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { value: config.value });
      } else {
        await ctx.db.insert("appConfigs", config);
      }
    }

    // 2. Seed schools
    console.log("🏫 Seeding schools...");
    for (const school of args.schools) {
      const existing = await ctx.db
        .query("schools")
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), school.name),
            q.eq(q.field("level"), school.level),
          ),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, school);
      } else {
        await ctx.db.insert("schools", school);
      }
    }

    // 3. Seed programs and build ID map
    console.log("📚 Seeding programs...");
    const programMap = new Map<string, Id<"programs">>();
    for (const program of args.programs) {
      const existing = await ctx.db
        .query("programs")
        .withIndex("by_program_name", (q) => q.eq("name", program.name))
        .unique();

      let programId: Id<"programs">;
      if (existing) {
        await ctx.db.patch(existing._id, program);
        programId = existing._id;
      } else {
        programId = await ctx.db.insert("programs", program);
      }
      programMap.set(program.name, programId);
    }

    // 3. Seed courses and build ID map
    console.log("📖 Seeding courses...");
    const courseMap = new Map<string, Id<"courses">>();
    for (const course of args.courses) {
      const existing = await ctx.db
        .query("courses")
        .withIndex("by_course_code", (q) => q.eq("code", course.code))
        .unique();

      let courseId: Id<"courses">;
      if (existing) {
        await ctx.db.patch(existing._id, course);
        courseId = existing._id;
      } else {
        courseId = await ctx.db.insert("courses", course);
      }
      courseMap.set(course.code, courseId);
    }

    // 4. Seed prerequisites
    console.log("🔗 Seeding prerequisites...");
    for (const prereq of args.prerequisites) {
      const courseId = courseMap.get(prereq.courseCode);
      if (!courseId) {
        console.warn(`Course not found: ${prereq.courseCode}`);
        continue;
      }

      if (prereq.type === "options" && "creditsRequired" in prereq) {
        await ctx.db.insert("prerequisites", {
          courseId,
          type: prereq.type,
          courses: prereq.courses,
          creditsRequired: prereq.creditsRequired,
        });
      } else {
        await ctx.db.insert("prerequisites", {
          courseId,
          type: prereq.type,
          courses: prereq.courses,
        });
      }
    }

    // 5. Seed requirements
    console.log("📋 Seeding requirements...");
    for (const req of args.requirements) {
      const programId = programMap.get(req.programName);
      if (!programId) {
        console.warn(`Program not found: ${req.programName}`);
        continue;
      }

      if (
        req.type === "options" &&
        "courseLevels" in req &&
        "creditsRequired" in req
      ) {
        await ctx.db.insert("requirements", {
          programId,
          isMajor: req.isMajor,
          type: req.type,
          courses: req.courses,
          courseLevels: req.courseLevels,
          creditsRequired: req.creditsRequired,
        });
      } else {
        await ctx.db.insert("requirements", {
          programId,
          isMajor: req.isMajor,
          type: req.type,
          courses: req.courses,
        });
      }
    }

    // 6. Seed course offerings
    console.log("🗓  Seeding course offerings...");
    for (const offering of args.courseOfferings) {
      const existing = await ctx.db
        .query("courseOfferings")
        .withIndex("by_class_number", (q) =>
          q
            .eq("classNumber", offering.classNumber)
            .eq("term", offering.term)
            .eq("year", offering.year),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, offering);
      } else {
        await ctx.db.insert("courseOfferings", offering);
      }
    }

    // 7. Seed user courses
    console.log("📚 Seeding user courses...");
    for (const userCourse of args.userCourses) {
      const existing = await ctx.db
        .query("userCourses")
        .withIndex("by_user_course_term", (q) =>
          q
            .eq("userId", userCourse.userId)
            .eq("courseCode", userCourse.courseCode)
            .eq("year", userCourse.year)
            .eq("term", userCourse.term),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, userCourse);
      } else {
        await ctx.db.insert("userCourses", userCourse);
      }
    }

    // 9. Seed user course offerings
    console.log("🎯 Seeding user course offerings...");
    for (const offering of args.userCourseOfferings) {
      await ctx.db.insert("userCourseOfferings", offering);
    }

    console.log("✅ Database seeding completed successfully!");
    return { success: true, message: "Database seeded successfully" };
  },
});
