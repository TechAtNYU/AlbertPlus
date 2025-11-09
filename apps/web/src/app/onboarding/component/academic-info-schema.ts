import z from "zod";

export const academicInfoSchema = z
  .object({
    school: z.string().min(1, "Please select your school or college"),
    programs: z.array(z.string()).min(1, "At least one program is required"),
    startingDate: z.object({
      year: z.number().min(2000).max(2100),
      term: z.enum(["spring", "fall"]),
    }),
    expectedGraduationDate: z.object({
      year: z.number().min(2000).max(2100),
      term: z.enum(["spring", "fall"]),
    }),
  })
  .refine(
    (data) => {
      const startValue =
        data.startingDate.year + (data.startingDate.term === "fall" ? 1 : 0.5);
      const gradValue =
        data.expectedGraduationDate.year +
        (data.expectedGraduationDate.term === "fall" ? 1 : 0.5);
      return gradValue > startValue;
    },
    {
      message: "Expected graduation date must be after the starting date",
      path: ["expectedGraduationDate"],
    },
  );

export type AcademicInfoFormValues = z.infer<typeof academicInfoSchema>;
