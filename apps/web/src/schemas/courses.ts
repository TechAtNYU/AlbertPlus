import z from "zod";

export const termSchema = z.union([
  z.literal("spring"),
  z.literal("summer"),
  z.literal("fall"),
  z.literal("j-term"),
]);

export const gradeSchema = z
  .union([
    z.literal("a"),
    z.literal("a-"),
    z.literal("b+"),
    z.literal("b"),
    z.literal("b-"),
    z.literal("c+"),
    z.literal("c"),
    z.literal("c-"),
    z.literal("d+"),
    z.literal("d"),
    z.literal("p"),
    z.literal("f"),
    z.literal("w"),
  ])
  .catch("p");

export const userCourseSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  title: z.string().min(1, "Course title is required"),
  year: z.number().int().min(2000).max(2100),
  term: termSchema,
  alternativeOf: z.string().optional(),
  grade: gradeSchema.optional(),
});
