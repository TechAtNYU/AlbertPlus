import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";

export type UserCourse = Omit<
  Doc<"userCourses">,
  "_id" | "_creationTime" | "userId" | "alternativeOf"
>;
export type Grade = NonNullable<Doc<"userCourses">["grade"]>;
