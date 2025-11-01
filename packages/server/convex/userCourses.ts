import { v } from "convex/values";
import { omit } from "convex-helpers";
import { getOneFrom } from "convex-helpers/server/relationships";
import { partial } from "convex-helpers/validators";
import { protectedMutation, protectedQuery } from "./helpers/auth";
import { userCourses } from "./schemas/courses";

export const getUserCourses = protectedQuery({
  args: {},
  handler: async (ctx) => {
    const userCourses = await ctx.db
      .query("userCourses")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
      .collect();

    return await Promise.all(
      userCourses.map(async (userCourse) => {
        const course = await getOneFrom(
          ctx.db,
          "courses",
          "by_course_code",
          userCourse.courseCode,
          "code",
        );

        return {
          ...userCourse,
          course,
        };
      }),
    );
  },
});

export const createUserCourse = protectedMutation({
  args: omit(userCourses, ["userId"]),
  handler: async (ctx, args) => {
    return await ctx.db.insert("userCourses", {
      userId: ctx.user.subject,
      ...args,
    });
  },
});

export const updateUserCourse = protectedMutation({
  args: {
    id: v.id("userCourses"),
    ...partial(omit(userCourses, ["userId", "courseCode"])),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const userCourse = await ctx.db.get(id);

    if (!userCourse || userCourse.userId !== ctx.user.subject) {
      throw new Error("User course not found or unauthorized");
    }

    return await ctx.db.patch(id, updates);
  },
});

export const deleteUserCourse = protectedMutation({
  args: { id: v.id("userCourses") },
  handler: async (ctx, args) => {
    const userCourse = await ctx.db.get(args.id);

    if (!userCourse || userCourse.userId !== ctx.user.subject) {
      throw new Error("User course not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const importUserCourses = protectedMutation({
  args: {
    courses: v.array(v.object(omit(userCourses, ["userId"]))),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    const skippedCount = { duplicates: 0, updated: 0 };

    for (const course of args.courses) {
      // Check if this exact course already exists for this user
      const existing = await ctx.db
        .query("userCourses")
        .withIndex("by_user_course_term", (q) =>
          q
            .eq("userId", ctx.user.subject)
            .eq("courseCode", course.courseCode)
            .eq("year", course.year)
            .eq("term", course.term),
        )
        .first();

      if (existing) {
        // If the course exists and has no grade, but the new one has a grade, update it
        if (!existing.grade && course.grade) {
          await ctx.db.patch(existing._id, { grade: course.grade });
          skippedCount.updated++;
        } else {
          // Otherwise, skip duplicate
          skippedCount.duplicates++;
        }
      } else {
        // Insert new course
        const id = await ctx.db.insert("userCourses", {
          userId: ctx.user.subject,
          ...course,
        });
        insertedIds.push(id);
      }
    }

    return {
      inserted: insertedIds.length,
      updated: skippedCount.updated,
      duplicates: skippedCount.duplicates,
      ids: insertedIds,
    };
  },
});
