/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: bypass for now */
import type {
  ZUpsertProgramWithRequirements,
  ZUpsertRequirements,
} from "@albert-plus/server/convex/http";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as z from "zod/mini";

type RequirementItem = z.infer<typeof ZUpsertRequirements>[number];

export type ProgramRequirement =
  | Omit<Extract<RequirementItem, { type: "required" }>, "programId">
  | Omit<Extract<RequirementItem, { type: "alternative" }>, "programId">
  | Omit<Extract<RequirementItem, { type: "options" }>, "programId">;

export async function discoverPrograms(url: string): Promise<string[]> {
  // TODO: implement this function
  return [];
}

export async function scrapeProgram(
  url: string,
  db: DrizzleD1Database,
  env: CloudflareBindings,
): Promise<{
  program: Omit<z.infer<typeof ZUpsertProgramWithRequirements>, "requirements">;
  requirements: ProgramRequirement[];
}> {
  // TODO: implement this function
  throw new Error("Not implemented");
}
