import clsx from "clsx";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CoursePlanFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  creditFilter: number | null;
  onCreditFilterChange: (credit: number | null) => void;
  availableCredits: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CoursePlanFilters = ({
  searchInput,
  onSearchChange,
  creditFilter,
  onCreditFilterChange,
  availableCredits,
  isExpanded,
  onToggleExpand,
}: CoursePlanFiltersProps) => {
  const hasActiveFilters = creditFilter !== null;

  return (
    <div className="flex flex-col space-y-2">
      <div className="space-y-2">
        <Label htmlFor="course-search">Search Courses</Label>
        <div className="flex gap-2">
          <Input
            id="course-search"
            placeholder="Search by course name or code..."
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onToggleExpand}
            className={clsx("shrink-0", hasActiveFilters && "text-primary")}
            title={isExpanded ? "Hide filters" : "Show filters"}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col space-y-2">
          <Label>Credits</Label>
          <div className="flex flex-row gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onCreditFilterChange(null)}
              className={clsx(
                "px-3 py-2 text-sm font-medium border rounded-lg transition-colors",
                creditFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted",
              )}
            >
              All
            </button>
            {availableCredits.map((credit) => (
              <button
                type="button"
                key={credit}
                onClick={() => onCreditFilterChange(credit)}
                className={clsx(
                  "px-3 py-2 text-sm font-medium border rounded-lg transition-colors",
                  creditFilter === credit
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted",
                )}
              >
                {credit}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlanFilters;
