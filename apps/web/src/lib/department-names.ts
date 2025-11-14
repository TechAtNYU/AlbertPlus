// TODO: add in the rest of the departments
export const DEPARTMENT_NAMES: Record<string, string> = {
  "CSCI-UA": "Computer Science",
  "MATH-UA": "Mathematics",
  "DSGA-UA": "Data Science",
  "WRIT-UA": "Writing",
  "PSYCH-UA": "Psychology",
  "HIST-UA": "History",
  "CORE-UA": "Core Curriculum",
  "ECON-UA": "Economics",
  "PHIL-UA": "Philosophy",
  "PHYS-UA": "Physics",
  "CHEM-UA": "Chemistry",
  "BIOL-UA": "Biology",
  "ENGL-UA": "English",
  "POLI-UA": "Political Science",
  "SOCI-UA": "Sociology",
} as const;

/**
 * Gets the display name for a course prefix
 * @param prefix - The course prefix (e.g., "CSCI-UA", "MATH-UA")
 * @returns The full department name, or the prefix itself if not found
 */
export function getDepartmentName(prefix: string): string {
  return DEPARTMENT_NAMES[prefix] ?? prefix;
}
