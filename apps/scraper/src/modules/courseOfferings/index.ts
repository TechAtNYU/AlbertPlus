/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: bypass for now */
import type { ZUpsertCourseOfferings } from "@albert-plus/server/convex/http";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as z from "zod/mini";

export type CourseOfferingData = z.infer<typeof ZUpsertCourseOfferings>;

export async function discoverCourseOfferings(
  url: string,
  term: "spring" | "summer" | "fall" | "j-term",
  year: number,
): Promise<string[]> {
  // TODO: implement this function to scrape the Albert public search listing
  // This should extract all course URLs from the search page for the given term/year
  // Example: returns ["https://albert.../CSCI-UA-101?term=spring&year=2025", ...]
  return [];
}

export async function scrapeCourseOfferings(
  url: string,
  db: DrizzleD1Database,
  env: CloudflareBindings,
): Promise<CourseOfferingData> {
  // TODO: implement this function to scrape a single course page
  throw new Error("Not implemented");
}
