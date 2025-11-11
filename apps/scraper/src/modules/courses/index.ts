/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: bypass for now */
import type {
  ZUpsertCourseWithPrerequisites,
  ZUpsertPrerequisites,
} from "@albert-plus/server/convex/http";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as z from "zod/mini";

type PrerequisiteItem = z.infer<typeof ZUpsertPrerequisites>[number];

export type CoursePrerequisite =
  | Omit<Extract<PrerequisiteItem, { type: "required" }>, "courseId">
  | Omit<Extract<PrerequisiteItem, { type: "alternative" }>, "courseId">
  | Omit<Extract<PrerequisiteItem, { type: "options" }>, "courseId">;

export async function discoverCourses(url: string): Promise<string[]> {
  // TODO: implement this function
  return [];
}

export async function scrapeCourse(
  url: string,
  db: DrizzleD1Database,
  env: CloudflareBindings,
): Promise<{
  course: Omit<z.infer<typeof ZUpsertCourseWithPrerequisites>, "prerequisites">;
  prerequisites: CoursePrerequisite[];
}> {
  // TODO: implement this function
  throw new Error("Not implemented");
}
