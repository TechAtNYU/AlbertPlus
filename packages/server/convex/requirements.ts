import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { requirements } from "./schemas/programs";

export const createRequirementsInternal = internalMutation({
  args: {
    requirements: v.array(requirements),
  },
  handler: async (ctx, args) => {
    return await Promise.all(
      args.requirements.map((newReq) => {
        if (newReq.type === "options") {
          return ctx.db.insert("requirements", {
            programId: newReq.programId,
            isMajor: newReq.isMajor,
            description: newReq.description,
            type: newReq.type,
            courses: newReq.courses,
            courseLevels: newReq.courseLevels,
            creditsRequired: newReq.creditsRequired,
          });
        }
        return ctx.db.insert("requirements", {
          programId: newReq.programId,
          isMajor: newReq.isMajor,
          description: newReq.description,
          type: newReq.type,
          courses: newReq.courses,
        });
      }),
    );
  },
});

export const deleteRequirementsByProgramInternal = internalMutation({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const requirementsToDelete = await ctx.db
      .query("requirements")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    for (const requirement of requirementsToDelete) {
      await ctx.db.delete(requirement._id);
    }
  },
});
