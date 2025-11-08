import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getManyFrom } from "convex-helpers/server/relationships";
import { internalMutation } from "./_generated/server";
import { protectedQuery } from "./helpers/auth";
import { programs } from "./schemas/programs";
import { schoolName } from "./schemas/schools";

export const getProgramById = protectedQuery({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.id);
    if (!program) return null;

    const requirements = await getManyFrom(
      ctx.db,
      "requirements",
      "by_program",
      args.id,
      "programId",
    );

    const requirementsWithoutProgramId = requirements.map(
      ({ programId, ...rest }) => rest,
    );

    return {
      ...program,
      requirements: requirementsWithoutProgramId,
    };
  },
});

export const getProgramByName = protectedQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const program = await ctx.db
      .query("programs")
      .withIndex("by_program_name", (q) => q.eq("name", args.name))
      .unique();

    if (!program) return null;

    const requirements = await getManyFrom(
      ctx.db,
      "requirements",
      "by_program",
      program._id,
      "programId",
    );

    const requirementsWithoutProgramId = requirements.map(
      ({ programId, ...rest }) => rest,
    );

    return {
      ...program,
      requirements: requirementsWithoutProgramId,
    };
  },
});

export const getPrograms = protectedQuery({
  args: {
    query: v.optional(v.string()),
    schools: v.optional(v.array(schoolName)),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { query, schools, paginationOpts }) => {
    if (schools && schools.length > 0) {
      if (query) {
        const results = await Promise.all(
          schools.map((school) =>
            ctx.db
              .query("programs")
              .withSearchIndex("search_name", (q) =>
                q.search("name", query).eq("school", school),
              )
              .paginate(paginationOpts),
          ),
        );

        const allPrograms = results.flatMap((result) => result.page);
        const continueCursor = results.find(
          (result) => result.isDone === false,
        )?.continueCursor;

        return {
          page: allPrograms,
          isDone: results.every((result) => result.isDone),
          continueCursor: continueCursor ?? null,
        };
      }

      const results = await Promise.all(
        schools.map((school) =>
          ctx.db
            .query("programs")
            .withIndex("by_school", (q) => q.eq("school", school))
            .order("desc")
            .paginate(paginationOpts),
        ),
      );

      const allPrograms = results.flatMap((result) => result.page);
      const continueCursor = results.find(
        (result) => result.isDone === false,
      )?.continueCursor;

      return {
        page: allPrograms,
        isDone: results.every((result) => result.isDone),
        continueCursor: continueCursor ?? null,
      };
    }

    if (query) {
      return await ctx.db
        .query("programs")
        .withSearchIndex("search_name", (q) => q.search("name", query))
        .paginate(paginationOpts);
    }

    return await ctx.db
      .query("programs")
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const upsertProgramInternal = internalMutation({
  args: programs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("programs")
      .withIndex("by_program_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("programs", args);
    }
  },
});
