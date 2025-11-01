import { v } from "convex/values";
import { schoolName } from "./schools";

const courses = {
  code: v.string(), // CSCI-UA 101
  program: v.string(), // CSCI-UA
  level: v.number(), // 100
  title: v.string(), // Intro to Computer Science
  credits: v.number(), // 4
  school: schoolName,
  description: v.string(),
  courseUrl: v.string(),
};

const prerequisites = v.union(
  v.object({
    courseId: v.id("courses"),
    type: v.literal("required"),
    courses: v.array(v.string()), // course code
  }),
  v.object({
    courseId: v.id("courses"),
    type: v.literal("alternative"),
    courses: v.array(v.string()), // course code
  }),
  v.object({
    courseId: v.id("courses"),
    type: v.literal("options"),
    courses: v.array(v.string()), // course code
    creditsRequired: v.number(),
  }),
);

const userCourses = {
  userId: v.string(),
  courseCode: v.string(), // CSCI-UA 101
  title: v.string(),
  year: v.number(), // 2025
  term: v.union(
    v.literal("spring"),
    v.literal("summer"),
    v.literal("fall"),
    v.literal("j-term"),
  ),
  alternativeOf: v.optional(v.id("userCourses")), // course code
  grade: v.optional(
    v.union(
      v.literal("a"),
      v.literal("a-"),
      v.literal("b+"),
      v.literal("b"),
      v.literal("b-"),
      v.literal("c+"),
      v.literal("c"),
      v.literal("c-"),
      v.literal("d+"),
      v.literal("d"),
      v.literal("p"),
      v.literal("f"),
      v.literal("w"),
    ),
  ),
};

export { courses, prerequisites, userCourses };
