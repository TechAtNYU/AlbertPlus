import { v } from "convex/values";

export const schoolName = v.union(
  v.literal("College of Arts and Science"),
  v.literal("Graduate School of Arts and Science"),
  v.literal("College of Dentistry"),
  v.literal("Gallatin School of Individualized Study"),
  v.literal("Leonard N. Stern School of Business"),
  v.literal("Liberal Studies"),
  v.literal("NYU Abu Dhabi"),
  v.literal("NYU Shanghai"),
  v.literal("NYU Grossman School of Medicine"),
  v.literal("NYU Grossman Long Island School of Medicine"),
  v.literal("Robert F. Wagner Graduate School of Public Service"),
  v.literal("Rory Meyers College of Nursing"),
  v.literal("School of Global Public Health"),
  v.literal("School of Law"),
  v.literal("School of Professional Studies"),
  v.literal("Silver School of Social Work"),
  v.literal("Steinhardt School of Culture, Education, and Human Development"),
  v.literal("Tandon School of Engineering"),
  v.literal("Tisch School of the Arts"),
);

export const schools = {
  name: schoolName,
  shortName: v.string(), // CAS
  level: v.union(v.literal("undergraduate"), v.literal("graduate")),
};
