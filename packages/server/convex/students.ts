import { omit } from "convex-helpers";
import { getOneFrom } from "convex-helpers/server/relationships";
import { protectedMutation, protectedQuery } from "./helpers/auth";
import { students } from "./schemas/students";

export const getCurrentStudent = protectedQuery({
  args: {},
  handler: async (ctx) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user.subject))
      .unique();

    if (student === null) {
      return null;
    }

    const school = await getOneFrom(
      ctx.db,
      "schools",
      "by_id",
      student.school,
      "_id",
    );

    return {
      ...student,
      school,
    };
  },
});

export const upsertCurrentStudent = protectedMutation({
  args: omit(students, ["userId"]),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("students", {
        ...args,
        userId: ctx.user.subject,
      });
    }
  },
});
