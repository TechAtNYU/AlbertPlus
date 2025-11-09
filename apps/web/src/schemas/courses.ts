import z from "zod";

export const termSchema = z.union([
  z.literal("spring"),
  z.literal("summer"),
  z.literal("fall"),
  z.literal("j-term"),
]);

export const gradeSchema = z.union([
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
]);

export const schoolNameSchema = z.union([
  z.literal("College of Arts and Science"),
  z.literal("Graduate School of Arts and Science"),
  z.literal("College of Dentistry"),
  z.literal("Gallatin School of Individualized Study"),
  z.literal("Leonard N. Stern School of Business"),
  z.literal("Liberal Studies"),
  z.literal("NYU Abu Dhabi"),
  z.literal("NYU Shanghai"),
  z.literal("NYU Grossman School of Medicine"),
  z.literal("NYU Grossman Long Island School of Medicine"),
  z.literal("Robert F. Wagner Graduate School of Public Service"),
  z.literal("Rory Meyers College of Nursing"),
  z.literal("School of Global Public Health"),
  z.literal("School of Law"),
  z.literal("School of Professional Studies"),
  z.literal("Silver School of Social Work"),
  z.literal("Steinhardt School of Culture, Education, and Human Development"),
  z.literal("Tandon School of Engineering"),
  z.literal("Tisch School of the Arts"),
]);

export const userCourseSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  title: z.string().min(1, "Course title is required"),
  year: z.number().int().min(2000).max(2100),
  term: termSchema,
  alternativeOf: z.string().optional(),
  grade: gradeSchema.optional(),
});
