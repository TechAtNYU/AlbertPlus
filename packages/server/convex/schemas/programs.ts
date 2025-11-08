import { v } from "convex/values";
import { schoolName } from "./schools";

const programs = {
  name: v.string(), // Computer Science (BA)
  level: v.union(v.literal("undergraduate"), v.literal("graduate")),
  school: schoolName,
  programUrl: v.string(),
};

const requirements = v.union(
  v.object({
    programId: v.id("programs"),
    isMajor: v.boolean(),
    type: v.literal("required"),
    courses: v.array(v.string()), // course code
  }),
  v.object({
    programId: v.id("programs"),
    isMajor: v.boolean(),
    type: v.literal("alternative"),
    courses: v.array(v.string()), // course code
  }),
  v.object({
    programId: v.id("programs"),
    isMajor: v.boolean(),
    type: v.literal("options"),
    courses: v.array(v.string()), // course code
    courseLevels: v.array(
      v.object({
        program: v.string(), // CSCI-UA
        level: v.number(), // 400
      }),
    ), // course levels
    creditsRequired: v.number(),
  }),
);

export { programs, requirements };
