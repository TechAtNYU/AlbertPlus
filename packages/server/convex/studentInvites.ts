import { ConvexError } from "convex/values";
import { omit } from "convex-helpers";
import { protectedMutation, protectedQuery } from "./helpers/auth";
import { studentInvites } from "./schemas/studentInvites";

export const getCurrentUserInvite = protectedQuery({
  args: {},
  handler: async (ctx) => {
    const invite = await ctx.db
      .query("studentInvites")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user.subject))
      .unique();

    return invite;
  },
});

export const createInvite = protectedMutation({
  args: omit(studentInvites, ["userId"]),
  handler: async (ctx, args) => {
    // Check if invite already exists
    const existing = await ctx.db
      .query("studentInvites")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user.subject))
      .unique();

    if (existing) {
      throw new ConvexError("Invite already exists for this user");
    }

    return await ctx.db.insert("studentInvites", {
      ...args,
      userId: ctx.user.subject,
    });
  },
});
