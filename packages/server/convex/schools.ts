import { query } from "./_generated/server";

export const getSchools = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schools").collect();
  },
});
