import { v } from "convex/values";

const semester = v.object({
  year: v.number(),
  term: v.union(
    v.literal("spring"),
    v.literal("summer"),
    v.literal("fall"),
    v.literal("j-term"),
  ),
});

const students = {
  userId: v.string(),
  programs: v.array(v.id("programs")),
  school: v.id("schools"),
  startingDate: semester,
  expectedGraduationDate: semester,
};

export { students };
