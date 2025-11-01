import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getManyFrom } from "convex-helpers/server/relationships";
import { internalMutation } from "./_generated/server";
import { protectedQuery } from "./helpers/auth";
import { courses } from "./schemas/courses";
import { schoolName } from "./schemas/schools";

export const getCourseById = protectedQuery({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);

    if (!course) {
      return null;
    }

    const prerequisites = await getManyFrom(
      ctx.db,
      "prerequisites",
      "by_course",
      args.id,
      "courseId",
    );

    const prerequisitesWithoutCourseId = prerequisites.map(
      ({ courseId, ...rest }) => rest,
    );

    return {
      ...course,
      prerequisites: prerequisitesWithoutCourseId,
    };
  },
});

export const getCourseByCode = protectedQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_course_code", (q) => q.eq("code", args.code))
      .unique();

    if (!course) {
      return null;
    }

    const prerequisites = await getManyFrom(
      ctx.db,
      "prerequisites",
      "by_course",
      course._id,
      "courseId",
    );

    const prerequisitesWithoutCourseId = prerequisites.map(
      ({ courseId, ...rest }) => rest,
    );

    return {
      ...course,
      prerequisites: prerequisitesWithoutCourseId,
    };
  },
});

export const getCourses = protectedQuery({
  args: {
    level: v.number(),
    query: v.optional(v.string()),
    schools: v.optional(v.array(schoolName)),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.schools && args.schools.length > 0) {
      if (args.query !== undefined) {
        const results = await Promise.all(
          args.schools.map((school) =>
            ctx.db
              .query("courses")
              .withSearchIndex("search_title", (q) =>
                q
                  .search("title", args.query as string)
                  .eq("level", args.level)
                  .eq("school", school),
              )
              .paginate(args.paginationOpts),
          ),
        );

        const allCourses = results.flatMap((result) => result.page);
        const continueCursor = results.find(
          (result) => result.isDone === false,
        )?.continueCursor;

        return {
          page: allCourses,
          isDone: results.every((result) => result.isDone),
          continueCursor: continueCursor ?? null,
        };
      }

      const results = await Promise.all(
        args.schools.map((school) =>
          ctx.db
            .query("courses")
            .withIndex("by_school_level", (q) =>
              q.eq("school", school).eq("level", args.level),
            )
            .order("desc")
            .paginate(args.paginationOpts),
        ),
      );

      const allCourses = results.flatMap((result) => result.page);
      const continueCursor = results.find(
        (result) => result.isDone === false,
      )?.continueCursor;

      return {
        page: allCourses,
        isDone: results.every((result) => result.isDone),
        continueCursor: continueCursor ?? null,
      };
    }

    if (args.query !== undefined) {
      return await ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query as string).eq("level", args.level),
        )
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("courses")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const upsertCourseInternal = internalMutation({
  args: courses,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courses")
      .withIndex("by_course_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("courses", args);
    }
  },
});
