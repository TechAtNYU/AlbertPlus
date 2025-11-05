"use client";

import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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
import type { Class } from "../schedule-calendar";

interface CourseInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Class | null;
  onDelete: (
    id: Id<"userCourseOfferings">,
    classNumber: number,
    title: string,
  ) => void;
}

export function CourseInfoDialog({
  open,
  onOpenChange,
  course,
  onDelete,
}: CourseInfoDialogProps) {
  if (!course) return null;

  const handleDelete = () => {
    if (course.userCourseOfferingId && course.classNumber) {
      onDelete(
        course.userCourseOfferingId as Id<"userCourseOfferings">,
        course.classNumber,
        course.title,
      );
      onOpenChange(false);
    }
  };

  const formatTimeSlot = (slot: { start: Date; end: Date }) => {
    return `${format(slot.start, "EEEE, h:mm a")} - ${format(slot.end, "h:mm a")}`;
  };

  const formatTerm = (term: string, year: number) => {
    const termMap: Record<string, string> = {
      spring: "Spring",
      summer: "Summer",
      fall: "Fall",
      "j-term": "J-Term",
    };
    return `${termMap[term] || term} ${year}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "closed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6 text-base">
              {course.title}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Course Code
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.courseCode}
                      </p>
                    </div>

                    {course.classNumber && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Class Number
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {course.classNumber}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Section
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.section.toUpperCase()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Term
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTerm(course.term, course.year)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Instructor
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {course.instructor.join(", ") || "TBA"}
                    </p>
                  </div>

                  {course.location && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Location
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.location}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Schedule
                    </p>
                    <div className="space-y-2">
                      {course.times.map((slot, index) => (
                        <p
                          key={`${slot.start.toString()}-${index}`}
                          className="text-sm text-muted-foreground"
                        >
                          {formatTimeSlot(slot)}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(course.status)}`}
                      >
                        {course.status.charAt(0).toUpperCase() +
                          course.status.slice(1)}
                      </span>
                      {course.status === "waitlist" &&
                        course.waitlistNum !== undefined && (
                          <span className="text-sm text-muted-foreground">
                            ({course.waitlistNum} on waitlist)
                          </span>
                        )}
                    </div>
                  </div>

                  {course.isCorequisite && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Corequisite
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {course.corequisiteOf
                          ? `Corequisite of class ${course.corequisiteOf}`
                          : "This is a corequisite course"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          {!course.isPreview && course.userCourseOfferingId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="mr-2 size-4" />
              Delete Course
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
