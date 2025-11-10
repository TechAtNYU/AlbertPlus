import type { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import type { KeyboardEvent } from "react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TermYearSelectorProps {
  course: Doc<"courses">;
  student:
    | FunctionReturnType<typeof api.students.getCurrentStudent>
    | undefined;
  onConfirm: (
    courseCode: string,
    title: string,
    year: number,
    term: string,
  ) => void;
  onClose: () => void;
}

const TERMS = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "j-term", label: "J-Term" },
];

const TermYearSelector = ({
  course,
  student,
  onConfirm,
  onClose,
}: TermYearSelectorProps) => {
  const dialogTitleId = useId();
  const currentYear = new Date().getFullYear();
  const [selectedTerm, setSelectedTerm] = useState<string>("fall");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Generate year options based on student's academic timeline
  const yearOptions = useMemo(() => {
    if (student?.startingDate && student?.expectedGraduationDate) {
      const startYear = student.startingDate.year;
      const endYear = student.expectedGraduationDate.year;
      const numYears = endYear - startYear + 1;
      return Array.from({ length: numYears }, (_, i) => startYear + i);
    }
    // Fallback to current year +/- 2 if no student data
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, [student, currentYear]);

  const handleConfirm = () => {
    onConfirm(course.code, course.title, selectedYear, selectedTerm);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-black/50 border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        onClick={onClose}
      />
      <div
        className="relative z-10 bg-background border rounded-lg shadow-lg p-6 w-full max-w-sm mx-4"
        role="dialog"
        onKeyDown={handleDialogKeyDown}
      >
        <h3 id={dialogTitleId} className="text-lg font-semibold mb-4">
          Add Course to Plan
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium mb-2">{course.title}</p>
            <p className="text-xs text-muted-foreground">
              {course.code} • {course.credits} credits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="space-y-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger id="term-select">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Add Course</Button>
        </div>
      </div>
    </div>
  );
};

export default TermYearSelector;
