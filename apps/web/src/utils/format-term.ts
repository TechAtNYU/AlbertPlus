import type { Term } from "@/components/AppConfigProvider";

export function formatTermTitle(term: Term | null, year: number | null) {
  if (!term || !year) {
    return undefined;
  }
  return `${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`;
}
