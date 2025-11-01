import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Term, UserCourse } from "../types";

type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: UserCourse[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
};

const termLabels: Record<Term, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  "j-term": "J-Term",
};

function groupCoursesByYearAndTerm(courses: UserCourse[]) {
  const grouped = new Map<string, UserCourse[]>();

  for (const course of courses) {
    const key = `${course.year}-${course.term}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(course);
  }

  // Sort by year and term (oldest first)
  const sorted = Array.from(grouped.entries()).sort(([a], [b]) => {
    const [yearA, termA] = a.split("-");
    const [yearB, termB] = b.split("-");
    if (yearA !== yearB) return Number(yearA) - Number(yearB);
    const termOrder = ["spring", "summer", "fall", "j-term"];
    return termOrder.indexOf(termA) - termOrder.indexOf(termB);
  });

  return sorted;
}

export default function ConfirmModal({
  open,
  onOpenChange,
  courses,
  onConfirm,
  onCancel,
  isImporting = false,
}: ConfirmModalProps) {
  const groupedCourses = groupCoursesByYearAndTerm(courses);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-2xl [&>button:last-child]:top-6">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6 text-xl">
              Confirm Course History
            </DialogTitle>
            <DialogDescription asChild>
              <div className="px-6 py-3">
                <p className="mb-4 text-sm text-muted-foreground">
                  We found {courses.length} course
                  {courses.length !== 1 ? "s" : ""} in your Degree Progress
                  Report. Please review and confirm.
                </p>
                <div className="space-y-6">
                  {groupedCourses.map(([key, termCourses]) => {
                    const [year, term] = key.split("-");
                    return (
                      <div key={key} className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {termLabels[term as Term]} {year}
                        </h3>
                        <div className="space-y-2">
                          {termCourses.map((course, idx) => (
                            <div
                              key={`${course.courseCode}-${idx}`}
                              className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-3 text-sm"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {course.courseCode}
                                  </span>
                                  {course.grade && (
                                    <span className="rounded-md bg-background px-2 py-0.5 text-xs font-medium uppercase">
                                      {course.grade}
                                    </span>
                                  )}
                                </div>
                                <p className="text-muted-foreground">
                                  {course.title}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isImporting}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onConfirm} disabled={isImporting}>
            {isImporting ? "Importing..." : "Confirm & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
