import { ConvexError, v } from "convex/values";
import { omit } from "convex-helpers";
import { getOneFrom } from "convex-helpers/server/relationships";
import { protectedMutation, protectedQuery } from "./helpers/auth";
import { findTimeConflicts } from "./helpers/timeConflicts";
import { userCourseOfferings } from "./schemas/courseOfferings";

export const getUserCourseOfferings = protectedQuery({
  args: {},
  handler: async (ctx) => {
    const userCourseOfferings = await ctx.db
      .query("userCourseOfferings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
      .collect();

    return await Promise.all(
      userCourseOfferings.map(async (userOffering) => {
        const courseOffering = await getOneFrom(
          ctx.db,
          "courseOfferings",
          "by_class_number",
          userOffering.classNumber,
          "classNumber",
        );

        if (!courseOffering) {
          throw new Error("Course offering not found");
        }

        return {
          ...userOffering,
          courseOffering,
        };
      }),
    );
  },
});

export const getScheduleCourseOfferings = protectedQuery({
  args: {},
  handler: async (ctx) => {
    let userCourseOfferings = await ctx.db
      .query("userCourseOfferings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
      .collect();

    userCourseOfferings = userCourseOfferings.filter(
      (course) => course.alternativeOf === undefined,
    );

    return await Promise.all(
      userCourseOfferings.map(async (userOffering) => {
        const courseOffering = await getOneFrom(
          ctx.db,
          "courseOfferings",
          "by_class_number",
          userOffering.classNumber,
          "classNumber",
        );

        if (!courseOffering) {
          throw new Error("Course offering not found");
        }

        return {
          ...userOffering,
          courseOffering,
        };
      }),
    );
  },
});

export const addUserCourseOffering = protectedMutation({
  args: {
    ...omit(userCourseOfferings, ["userId"]),
    forceAdd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { forceAdd, ...insertArgs } = args;

    const existing = await ctx.db
      .query("userCourseOfferings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
      .filter((q) => q.eq(q.field("classNumber"), args.classNumber))
      .unique();

    if (existing) {
      throw new ConvexError("Course offering already added to user schedule");
    }

    const newCourseOffering = await getOneFrom(
      ctx.db,
      "courseOfferings",
      "by_class_number",
      args.classNumber,
      "classNumber",
    );

    if (!newCourseOffering) {
      throw new ConvexError("Course offering not found");
    }

    // Only check for conflicts if this is not being added as an alternative
    // and if the new course has time information
    if (
      !args.alternativeOf &&
      !forceAdd &&
      newCourseOffering.startTime &&
      newCourseOffering.endTime
    ) {
      const userCourses = await ctx.db
        .query("userCourseOfferings")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
        .filter((q) => q.eq(q.field("alternativeOf"), undefined))
        .collect();

      const existingCourseOfferings = await Promise.all(
        userCourses.map(async (userCourse) => {
          const offering = await getOneFrom(
            ctx.db,
            "courseOfferings",
            "by_class_number",
            userCourse.classNumber,
            "classNumber",
          );
          return offering;
        }),
      );

      // Only check courses that have time information
      const validOfferings = existingCourseOfferings.filter(
        (
          offering,
        ): offering is NonNullable<typeof offering> & {
          startTime: string;
          endTime: string;
        } =>
          offering !== null &&
          offering.startTime !== undefined &&
          offering.endTime !== undefined,
      );

      const conflicts = findTimeConflicts(
        {
          days: newCourseOffering.days,
          startTime: newCourseOffering.startTime,
          endTime: newCourseOffering.endTime,
        },
        validOfferings.map((offering) => ({
          days: offering.days,
          startTime: offering.startTime,
          endTime: offering.endTime,
          classNumber: offering.classNumber,
        })),
      );

      if (conflicts.length > 0) {
        throw new ConvexError({
          type: "TIME_CONFLICT",
          conflictingClassNumbers: conflicts,
        });
      }
    }

    return await ctx.db.insert("userCourseOfferings", {
      userId: ctx.user.subject,
      classNumber: insertArgs.classNumber,
      alternativeOf: insertArgs.alternativeOf,
    });
  },
});

export const updateUserCourseOffering = protectedMutation({
  args: {
    id: v.id("userCourseOfferings"),
    ...omit(userCourseOfferings, ["userId"]),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const userOffering = await ctx.db.get(id);

    if (!userOffering || userOffering.userId !== ctx.user.subject) {
      throw new Error("User course offering not found or unauthorized");
    }

    return await ctx.db.patch(args.id, updates);
  },
});

export const removeUserCourseOffering = protectedMutation({
  args: { id: v.id("userCourseOfferings") },
  handler: async (ctx, args) => {
    const userOffering = await ctx.db.get(args.id);

    if (!userOffering || userOffering.userId !== ctx.user.subject) {
      throw new Error("User course offering not found or unauthorized");
    }

    await ctx.db.delete(args.id);

    const alternatives = await ctx.db
      .query("userCourseOfferings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
      .filter((q) => q.eq(q.field("alternativeOf"), args.id))
      .collect();

    for (const alternative of alternatives) {
      await ctx.db.patch(alternative._id, { alternativeOf: undefined });
    }
  },
});

export const swapWithAlternative = protectedMutation({
  args: {
    alternativeId: v.id("userCourseOfferings"),
  },
  handler: async (ctx, args) => {
    const alternative = await ctx.db.get(args.alternativeId);

    if (!alternative || alternative.userId !== ctx.user.subject) {
      throw new ConvexError("Alternative course not found or unauthorized");
    }

    if (!alternative.alternativeOf) {
      throw new ConvexError(
        "This course is not an alternative of another course",
      );
    }

    const mainCourse = await ctx.db.get(alternative.alternativeOf);

    if (!mainCourse || mainCourse.userId !== ctx.user.subject) {
      throw new ConvexError("Main course not found or unauthorized");
    }

    // swap
    await ctx.db.patch(args.alternativeId, { alternativeOf: undefined });
    await ctx.db.patch(alternative.alternativeOf, {
      alternativeOf: args.alternativeId,
    });
  },
});

export const getAlternativeCourses = protectedQuery({
  args: { userCourseOfferingId: v.id("userCourseOfferings") },
  handler: async (ctx, args) => {
    const alternatives = await ctx.db
      .query("userCourseOfferings")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.subject))
      .filter((q) => q.eq(q.field("alternativeOf"), args.userCourseOfferingId))
      .collect();

    return await Promise.all(
      alternatives.map(async (alternative) => {
        const courseOffering = await getOneFrom(
          ctx.db,
          "courseOfferings",
          "by_class_number",
          alternative.classNumber,
          "classNumber",
        );

        if (!courseOffering) {
          throw new Error("Course offering not found");
        }

        return {
          ...alternative,
          courseOffering,
        };
      }),
    );
  },
});

export const getCourseOfferingsByClassNumbers = protectedQuery({
  args: { classNumbers: v.array(v.number()) },
  handler: async (ctx, args) => {
    return await Promise.all(
      args.classNumbers.map(async (classNumber) => {
        const courseOffering = await getOneFrom(
          ctx.db,
          "courseOfferings",
          "by_class_number",
          classNumber,
          "classNumber",
        );

        if (!courseOffering) {
          return null;
        }

        return courseOffering;
      }),
    );
  },
});
