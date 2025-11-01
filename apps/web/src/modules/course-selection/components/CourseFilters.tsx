import clsx from "clsx";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DaysOfWeek, { type DayOptionValue } from "./DaysOfWeek";

interface CourseFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  creditFilter: number | null;
  onCreditFilterChange: (credit: number | null) => void;
  selectedDays: DayOptionValue[];
  onSelectedDaysChange: (days: DayOptionValue[]) => void;
  availableCredits: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const CourseFilters = ({
  searchInput,
  onSearchChange,
  creditFilter,
  onCreditFilterChange,
  selectedDays,
  onSelectedDaysChange,
  availableCredits,
  isExpanded,
  onToggleExpand,
}: CourseFiltersProps) => {
  const hasActiveFilters = creditFilter !== null || selectedDays.length !== 5;

  return (
    <div className="flex flex-col space-y-2">
      {/* Search Input with Filter Toggle */}
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

      {/* Collapsible Filters */}
      {isExpanded && (
        <>
          <DaysOfWeek
            selectedDays={selectedDays}
            onSelectedDaysChange={onSelectedDaysChange}
          />

          {/* Credit Filter Buttons */}
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
        </>
      )}
    </div>
  );
};
