import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { protectedQuery } from "./helpers/auth";
import { courseOfferings } from "./schemas/courseOfferings";

export const getCourseOfferingById = protectedQuery({
  args: { id: v.id("courseOfferings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getCourseOfferingsByCourseCodes = protectedQuery({
  args: {
    courseCodes: v.array(v.string()),
    term: v.union(
      v.literal("spring"),
      v.literal("summer"),
      v.literal("fall"),
      v.literal("j-term"),
    ),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.courseCodes.map((courseCode) =>
        ctx.db
          .query("courseOfferings")
          .withIndex("by_course_term", (q) =>
            q
              .eq("courseCode", courseCode)
              .eq("term", args.term)
              .eq("year", args.year),
          )
          .collect(),
      ),
    );

    return results.flat();
  },
});

export const getCourseOfferingByClassNumber = protectedQuery({
  args: {
    classNumber: v.number(),
    term: v.union(
      v.literal("spring"),
      v.literal("summer"),
      v.literal("fall"),
      v.literal("j-term"),
    ),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseOfferings")
      .withIndex("by_class_number", (q) =>
        q
          .eq("classNumber", args.classNumber)
          .eq("term", args.term)
          .eq("year", args.year),
      )
      .unique();
  },
});

export const getCorequisitesByCourseCode = protectedQuery({
  args: {
    classNumber: v.number(),
    term: v.union(
      v.literal("spring"),
      v.literal("summer"),
      v.literal("fall"),
      v.literal("j-term"),
    ),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseOfferings")
      .withIndex("by_corequisite_of", (q) =>
        q
          .eq("corequisiteOf", args.classNumber)
          .eq("term", args.term)
          .eq("year", args.year),
      )
      .collect();
  },
});

export const getCourseOfferings = protectedQuery({
  args: {
    query: v.optional(v.string()),
    term: v.union(
      v.literal("spring"),
      v.literal("summer"),
      v.literal("fall"),
      v.literal("j-term"),
    ),
    year: v.number(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { query, paginationOpts, term, year }) => {
    const result = query
      ? await ctx.db
          .query("courseOfferings")
          .withSearchIndex("search_title", (q) =>
            q
              .search("title", query)
              .eq("isCorequisite", false)
              .eq("term", term)
              .eq("year", year),
          )
          .paginate(paginationOpts)
      : await ctx.db
          .query("courseOfferings")
          .withIndex("by_term_year", (q) =>
            q.eq("isCorequisite", false).eq("term", term).eq("year", year),
          )
          .order("desc")
          .paginate(paginationOpts);

    const courseCodes = [...new Set(result.page.map((o) => o.courseCode))];

    const coursesMap = new Map();
    await Promise.all(
      courseCodes.map(async (code) => {
        const course = await ctx.db
          .query("courses")
          .withIndex("by_course_code", (q) => q.eq("code", code))
          .unique();
        if (course) {
          coursesMap.set(code, course);
        }
      }),
    );

    return {
      ...result,
      page: result.page.map((offering) => ({
        ...offering,
        course: coursesMap.get(offering.courseCode) ?? null,
      })),
    };
  },
});

export const getCourseOfferingsWithCourses = protectedQuery({
  args: {
    term: v.union(
      v.literal("spring"),
      v.literal("summer"),
      v.literal("fall"),
      v.literal("j-term"),
    ),
    year: v.number(),
  },
  handler: async (ctx, { term, year }) => {
    const offerings = await ctx.db
      .query("courseOfferings")
      .withIndex("by_term_year", (q) =>
        q.eq("isCorequisite", false).eq("term", term).eq("year", year),
      )
      .collect();

    const courseCodes = [...new Set(offerings.map((o) => o.courseCode))];

    const coursesMap = new Map();
    await Promise.all(
      courseCodes.map(async (code) => {
        const course = await ctx.db
          .query("courses")
          .withIndex("by_course_code", (q) => q.eq("code", code))
          .unique();
        if (course) {
          coursesMap.set(code, course);
        }
      }),
    );

    return {
      courses: Array.from(coursesMap.values()),
      courseOfferings: offerings,
    };
  },
});

export const upsertCourseOfferingInternal = internalMutation({
  args: courseOfferings,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courseOfferings")
      .withIndex("by_class_number", (q) =>
        q
          .eq("classNumber", args.classNumber)
          .eq("term", args.term)
          .eq("year", args.year),
      )
      .unique();

    if (existing) {
      return await ctx.db.patch(existing._id, args);
    }
    return await ctx.db.insert("courseOfferings", args);
  },
});

export const upsertCourseOfferingsInternal = internalMutation({
  args: { courseOfferings: v.array(v.object(courseOfferings)) },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.courseOfferings.map(async (offering) => {
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
          return await ctx.db.patch(existing._id, offering);
        }
        return await ctx.db.insert("courseOfferings", offering);
      }),
    );

    return results;
  },
});
