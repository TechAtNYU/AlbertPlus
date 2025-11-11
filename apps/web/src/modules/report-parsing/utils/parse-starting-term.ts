import { extractPdfText } from "./extract-pdf-text";

export interface StartingTerm {
  year: number;
  term: "spring" | "fall";
}

/**
 * Parses the Requirement Term for "Undergraduate Career" from a full PDF.
 * @param file PDF file (Degree Progress Report)
 * @returns StartingTerm or null if not found
 */
export async function extractStartingTerm(
  file: File,
): Promise<StartingTerm | null> {
  const text = await extractPdfText(file);

  // Normalize whitespace and line breaks
  const normalized = text.replace(/\s+/g, " ").toLowerCase();

  //only look for patter like: "undergraduate/graduate career fall 2023"
  const match = normalized.match(
    /(undergraduate|graduate)\s+career\s+(fall|spr)(?:g)?\s*(20\d{2})/,
  );

  if (!match) {
    return null;
  }

  const [termAbbr, yearStr] = match;

  const year = parseInt(yearStr, 10);
  const lower = termAbbr.toLowerCase();

  let term: "spring" | "fall";
  switch (lower) {
    case "spr":
    case "spring":
      term = "spring";
      break;
    case "fall":
      term = "fall";
      break;
    default:
      term = "fall";
  }

  return {
    year,
    term,
  };
}
