import { v } from "convex/values";

const students = {
  userId: v.string(),
  programs: v.array(v.id("programs")),
  school: v.id("schools"),
  startingDate: v.object({
    year: v.number(),
    term: v.union(v.literal("spring"), v.literal("fall")),
  }),
  expectedGraduationDate: v.object({
    year: v.number(),
    term: v.union(v.literal("spring"), v.literal("fall")),
  }),
};

export { students };
