export type Term = "spring" | "summer" | "fall" | "j-term";

export interface TermYear {
  term: Term;
  year: number;
}

export function formatTermTitle(term: Term | null, year: number | null) {
  if (!term || !year) {
    return undefined;
  }
  return `${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`;
}

const termMonthMap: Record<Term, number> = {
  fall: 9,
  "j-term": 1,
  spring: 3,
  summer: 6,
};

export function makeTermKey(term: Term, year: number): string {
  return `${term}-${year}`;
}

export function compareTermYear(a: TermYear, b: TermYear): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return termMonthMap[a.term] - termMonthMap[b.term];
}

export function getNextTerm(current: TermYear): TermYear {
  switch (current.term) {
    case "fall":
      return { term: "j-term", year: current.year + 1 };
    case "j-term":
      return { term: "spring", year: current.year };
    case "spring":
      return { term: "summer", year: current.year };
    case "summer":
      return { term: "fall", year: current.year };
    default:
      return current;
  }
}

const ordinalWords = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
] as const;

function getOrdinalSuffix(value: number): string {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) {
    return "th";
  }
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function getAcademicYearLabel(value: number): string {
  if (value > 0 && value <= ordinalWords.length) {
    return `${ordinalWords[value - 1]} Year`;
  }
  return `${value}${getOrdinalSuffix(value)} Year`;
}

export interface AcademicTimeline {
  termToYearIndex: Map<string, number>;
  totalYears: number;
}

export function buildAcademicTimeline(
  start: TermYear,
  end: TermYear,
): AcademicTimeline | null {
  if (compareTermYear(end, start) < 0) {
    return null;
  }

  const termToYearIndex = new Map<string, number>();
  let academicYear = 1;
  let current = start;

  termToYearIndex.set(makeTermKey(current.term, current.year), academicYear);

  let iterations = 0;
  while (!(current.term === end.term && current.year === end.year)) {
    const next = getNextTerm(current);
    if (next.term === start.term) {
      academicYear += 1;
    }
    current = next;
    termToYearIndex.set(makeTermKey(current.term, current.year), academicYear);
    iterations += 1;
    if (iterations > 200) {
      break;
    }
  }

  return {
    termToYearIndex,
    totalYears: academicYear,
  };
}
