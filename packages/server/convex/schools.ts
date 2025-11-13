import { v } from "convex/values";
import { query } from "./_generated/server";
import { schoolName } from "./schemas/schools";

export const getSchools = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schools").collect();
  },
});

export const getSchoolByNameAndLevel = query({
  args: {
    name: schoolName,
    level: v.union(v.literal("undergraduate"), v.literal("graduate")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schools")
      .withIndex("by_name_level", (q) =>
        q.eq("name", args.name).eq("level", args.level),
      )
      .unique();
  },
});
