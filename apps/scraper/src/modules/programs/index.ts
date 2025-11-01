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
  url = "https://bulletins.nyu.edu/";
  const res = await fetch(url);
  console.log("Status:", res.status);
  const html = await res.text();
  return [];
}

export async function scrapeProgram(
  url: string,
  db: DrizzleD1Database,
  env: CloudflareBindings
): Promise<{
  program: Omit<z.infer<typeof ZUpsertProgramWithRequirements>, "requirements">;
  requirements: ProgramRequirement[];
}> {
  const base = "https://bulletins.nyu.edu/";
  let target: URL;

  let program: z.infer<typeof ZUpsertProgram> = {
    name: "Unknown Program",
    level: "undergraduate",
    programUrl: url,
  };
  let requirements: ProgramRequirement[] = [];

  try {
    try {
      target = new URL(url, base);
    } catch {
      target = new URL(url);
    }

    console.log("Fetching:", target.toString());
    const res = await fetch(target.toString());
    console.log("Status:", res.status);

    const html = await res.text();
    console.log("Content from website:\n", html);

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title =
      (titleMatch?.[1] ?? "").trim() ||
      decodeURIComponent(
        target.pathname.split("/").filter(Boolean).pop() ?? ""
      ) ||
      "Unknown Program";

    program = {
      name: title,
      level: "undergraduate",
      programUrl: target.toString(),
    };
    requirements = [];
  } catch (err) {
    console.error("Error scraping program:", err);
  }
  return { program, requirements };
}
