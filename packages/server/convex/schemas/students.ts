import { v } from "convex/values";
import { schoolName } from "./schools";

const students = {
  userId: v.string(),
  programs: v.array(v.id("programs")),
  school: schoolName,
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
