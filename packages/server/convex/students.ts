import { omit } from "convex-helpers";
import { protectedMutation, protectedQuery } from "./helpers/auth";
import { students } from "./schemas/students";

export const getCurrentStudent = protectedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("students")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user.subject))
      .unique();
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
