import { v } from "convex/values";
import { schoolName } from "./schools";

const courseOfferings = {
  courseCode: v.string(), // CSCI-UA 102
  classNumber: v.number(), // 10349
  title: v.optional(v.string()),
  section: v.string(), // 001
  description: v.optional(v.string()),
  year: v.number(), // 2025
  term: v.union(
    v.literal("spring"),
    v.literal("summer"),
    v.literal("fall"),
    v.literal("j-term"),
  ),
  level: v.union(v.literal("undergraduate"), v.literal("graduate")),
  school: schoolName,
  instructors: v.array(v.string()),
  location: v.optional(v.string()),
  days: v.array(
    v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday"),
    ),
  ),
  startTime: v.optional(v.string()), // 13:00
  endTime: v.optional(v.string()), // 14:15
  status: v.union(
    v.literal("open"),
    v.literal("closed"),
    v.literal("waitlist"),
  ),
  waitlistNum: v.optional(v.number()),
  isCorequisite: v.boolean(),
  corequisiteOf: v.optional(v.number()), // class number
};

const userCourseOfferings = {
  userId: v.string(),
  classNumber: v.number(),
  alternativeOf: v.optional(v.id("userCourseOfferings")),
};

export { courseOfferings, userCourseOfferings };
