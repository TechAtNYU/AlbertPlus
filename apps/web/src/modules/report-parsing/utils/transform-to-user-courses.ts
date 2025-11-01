import type { Grade, Term, UserCourse } from "../types";

interface ParsedCourse {
  term: string;
  subject: string;
  catalogNumber: string;
  title: string;
  grade: string;
  units: string;
  type: string;
  meta?: Record<string, string>;
}

/**
 * Normalizes a term string from the parsed data to the schema format
 * @param termStr - e.g., "2024 Fall", "2023 Spr", "2022 Sum"
 * @returns Normalized term object with year and term
 */
function normalizeTerm(termStr: string): { year: number; term: Term } {
  const match = termStr.match(/^(20\d{2})\s+(Sum|Spr|Fall|Win)/i);
  if (!match) {
    throw new Error(`Invalid term format: ${termStr}`);
  }

  const year = parseInt(match[1], 10);
  const termAbbr = match[2].toLowerCase();

  let term: Term;
  switch (termAbbr) {
    case "spr":
      term = "spring";
      break;
    case "sum":
      term = "summer";
      break;
    case "fall":
      term = "fall";
      break;
    case "win":
      term = "j-term";
      break;
    default:
      throw new Error(`Unknown term abbreviation: ${termAbbr}`);
  }

  return { year, term };
}

/**
 * Normalizes a grade string to the schema format
 * @param gradeStr - e.g., "A", "A-", "B+", "P", "W"
 * @returns Normalized grade or undefined if no grade
 */
function normalizeGrade(gradeStr: string): Grade | undefined {
  if (!gradeStr || gradeStr.trim() === "") {
    return undefined;
  }

  const normalized = gradeStr.toLowerCase().trim() as Grade;
  const validGrades: Grade[] = [
    "a",
    "a-",
    "b+",
    "b",
    "b-",
    "c+",
    "c",
    "c-",
    "d+",
    "d",
    "p",
    "f",
    "w",
  ];

  if (validGrades.includes(normalized)) {
    return normalized;
  }

  return undefined;
}

/**
 * Transforms parsed course data to match the userCourses database schema
 * @param parsedCourses - Array of courses from parseCourseHistory
 * @returns Array of courses in userCourses schema format
 */
export function transformToUserCourses(
  parsedCourses: ParsedCourse[],
): UserCourse[] {
  return parsedCourses.map((course) => {
    const { year, term } = normalizeTerm(course.term);
    const courseCode = `${course.subject} ${course.catalogNumber}`;

    const userCourse: UserCourse = {
      courseCode,
      title: course.title,
      year,
      term,
    };

    const grade = normalizeGrade(course.grade);
    if (grade) {
      userCourse.grade = grade;
    }

    return userCourse;
  });
}
