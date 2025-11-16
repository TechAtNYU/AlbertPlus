/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: bypass for now */
import type {
  ZUpsertCourseWithPrerequisites,
  ZUpsertPrerequisites,
} from "@albert-plus/server/convex/http";
import type { schoolName } from "@albert-plus/server/convex/schemas/schools";
import type { Infer } from "convex/values";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as z from "zod/mini";

type PrerequisiteItem = z.infer<typeof ZUpsertPrerequisites>[number];

export type CoursePrerequisite =
  | Omit<Extract<PrerequisiteItem, { type: "required" }>, "courseId">
  | Omit<Extract<PrerequisiteItem, { type: "alternative" }>, "courseId">
  | Omit<Extract<PrerequisiteItem, { type: "options" }>, "courseId">;

type CourseLevel = "undergraduate" | "graduate";

export type SchoolName = Infer<typeof schoolName>;

const SCHOOL_CODE_TO_NAME: Record<string, SchoolName> = {
  UA: "College of Arts and Science",
  NA: "College of Arts and Science",

  CD: "College of Dentistry",
  UD: "College of Dentistry",
  ND: "College of Dentistry",
  DN: "College of Dentistry",

  UG: "Gallatin School of Individualized Study",
  GG: "Gallatin School of Individualized Study",

  GA: "Graduate School of Arts and Science",

  UF: "Liberal Studies",

  ML: "NYU Grossman Long Island School of Medicine",

  UZ: "Non-School Based Programs - UG",

  UH: "NYU Abu Dhabi",
  GH: "NYU Abu Dhabi",
  NH: "NYU Abu Dhabi",

  UI: "NYU Shanghai",
  GI: "NYU Shanghai",
  SHU: "NYU Shanghai",

  GP: "Robert F. Wagner Graduate School of Public Service",
  UW: "Robert F. Wagner Graduate School of Public Service",
  NP: "Robert F. Wagner Graduate School of Public Service",

  GN: "Rory Meyers College of Nursing",
  UN: "Rory Meyers College of Nursing",

  GU: "School of Global Public Health",
  UU: "School of Global Public Health",
  NU: "School of Global Public Health",

  LW: "School of Law",
  NL: "School of Law",

  GC: "School of Professional Studies",
  UC: "School of Professional Studies",
  CE: "School of Professional Studies",

  NS: "Silver School of Social Work",
  GS: "Silver School of Social Work",
  US: "Silver School of Social Work",

  NE: "Steinhardt School of Culture, Education, and Human Development",
  UE: "Steinhardt School of Culture, Education, and Human Development",
  GE: "Steinhardt School of Culture, Education, and Human Development",

  GB: "Leonard N. Stern School of Business",
  UB: "Leonard N. Stern School of Business",

  GY: "Tandon School of Engineering",
  UY: "Tandon School of Engineering",
  GX: "Tandon School of Engineering",

  NT: "Tisch School of the Arts",
  GT: "Tisch School of the Arts",
  UT: "Tisch School of the Arts",

  MD: "NYU Grossman School of Medicine",
};

export function getSchoolFromProgram(program: string): SchoolName {
  const code = program.split("-").pop()?.toUpperCase() ?? "";
  const school = SCHOOL_CODE_TO_NAME[code];
  return school ?? "College of Arts and Science";
}

const GRADUATE_PROGRAM_CODES = new Set([
  "GA",
  "GG",
  "GH",
  "GI",
  "GP",
  "GN",
  "GU",
  "GC",
  "GS",
  "GE",
  "GB",
  "GY",
  "GX",
  "GT",
  "MD",
  "LW",
  "NL",
  "NP",
]);

function getCourseLevel(program: string, courseNumber: string): CourseLevel {
  const programCode = program.split("-").pop()?.toUpperCase() ?? "";

  if (GRADUATE_PROGRAM_CODES.has(programCode)) {
    return "graduate";
  }

  if (programCode.startsWith("U")) {
    return "undergraduate";
  }

  const normalized = courseNumber.replace(/\D/g, "").padStart(4, "0");
  const firstDigit = Number.parseInt(normalized[0], 10);

  if (!Number.isNaN(firstDigit) && firstDigit >= 5) {
    return "graduate";
  }

  return "undergraduate";
}

export async function discoverCourses(url: string): Promise<string[]> {
  const courses: string[] = [];

  const response = await fetch(url);

  class CourseLinkHandler {
    element(element: Element) {
      const href = element.getAttribute("href");
      if (href?.startsWith("/courses/") && href !== "/courses/") {
        const baseUrl = new URL(url);
        const absoluteUrl = new URL(href, baseUrl).toString();
        courses.push(absoluteUrl);
      }
    }
  }

  const rewriter = new HTMLRewriter().on(
    'a[href^="/courses/"]',
    new CourseLinkHandler(),
  );

  await rewriter.transform(response).arrayBuffer();

  return courses;
}

interface ParsedCourse {
  course: Omit<z.infer<typeof ZUpsertCourseWithPrerequisites>, "prerequisites">;
  prerequisites: CoursePrerequisite[];
}

export async function scrapeCourse(
  url: string,
  db: DrizzleD1Database,
  env: CloudflareBindings,
): Promise<ParsedCourse[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch course page: ${response.status}`);
  }

  const courses: ParsedCourse[] = [];
  let currentCode = "";
  let currentTitle = "";
  let currentCredits = 0;
  let currentDescription = "";
  let currentPrereqs = "";

  class CourseBlockHandler {
    element(element: Element) {
      currentCode = "";
      currentTitle = "";
      currentCredits = 0;
      currentDescription = "";
      currentPrereqs = "";

      element.onEndTag(() => {
        if (currentCode && currentTitle) {
          const codeMatch = currentCode.match(/([A-Z]+(?:-[A-Z]+)?)\s+(\d+)/);
          if (codeMatch) {
            const [, program, courseNumber] = codeMatch;
            const level = getCourseLevel(program, courseNumber);

            courses.push({
              course: {
                program,
                code: currentCode,
                level,
                title: currentTitle,
                credits: Math.floor(currentCredits),
                description: currentDescription || "No description available.",
                courseUrl: url,
                school: getSchoolFromProgram(program),
              },
              prerequisites: currentPrereqs
                ? parsePrerequisites(currentPrereqs)
                : [],
            });
          }
        }
      });
    }
  }

  class CodeHandler {
    text(text: { text: string }) {
      currentCode += text.text.trim();
    }
  }

  class TitleHandler {
    text(text: { text: string }) {
      currentTitle += text.text.trim();
    }
  }

  class CreditsHandler {
    text(text: { text: string; lastInTextNode: boolean }) {
      const trimmed = text.text.trim();
      if (trimmed) {
        const match = trimmed.match(/\((\d+(?:\.\d+)?)\s*Credits?\)/);
        if (match) {
          currentCredits = Number.parseFloat(match[1]);
        }
      }
    }
  }

  class DescriptionHandler {
    text(text: { text: string }) {
      const trimmed = text.text.trim();
      if (trimmed) {
        currentDescription += (currentDescription ? " " : "") + trimmed;
      }
    }
  }

  class PrereqHandler {
    text(text: { text: string }) {
      currentPrereqs += `${text.text.trim()} `;
    }
  }

  const rewriter = new HTMLRewriter()
    .on(".courseblock", new CourseBlockHandler())
    .on(".detail-code strong", new CodeHandler())
    .on(".detail-title strong", new TitleHandler())
    .on(".detail-hours_html strong", new CreditsHandler())
    .on(".courseblockextra", new DescriptionHandler())
    .on(".detail-prerequisites", new PrereqHandler());

  await rewriter.transform(response).arrayBuffer();

  return courses;
}

function parsePrerequisites(text: string): CoursePrerequisite[] {
  const prerequisites: CoursePrerequisite[] = [];

  const cleanText = text.replace(/^Prerequisites?:\s*/i, "").trim();

  // Match course codes
  const coursePattern = /([A-Z]+(?:-[A-Z]+)?)\s+(\d+)/g;
  const matches = [...cleanText.matchAll(coursePattern)];

  if (matches.length > 0) {
    const courses = matches.map((match) => `${match[1]} ${match[2]}`);

    // TODO: Now it cannot handle "NOT open to students who take ..."
    // Check if it's an "or" (alternative) or "and" (required) relationship
    if (cleanText.toLowerCase().includes(" or ")) {
      prerequisites.push({
        type: "alternative",
        courses,
      });
    } else {
      prerequisites.push({
        type: "required",
        courses,
      });
    }
  }

  return prerequisites;
}
