"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronDown, CircleAlertIcon, GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CourseOffering } from "../types";

type ConflictDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCourse: CourseOffering | null;
  conflictingCourses: CourseOffering[];
  onAddAsMain: () => void;
  onAddAsAlternative: (alternativeOf: Id<"userCourseOfferings">) => void;
  onCancel: () => void;
  isAdding?: boolean;
};

export default function ConflictDialog({
  open,
  onOpenChange,
  newCourse,
  conflictingCourses,
  onAddAsMain,
  onAddAsAlternative,
  onCancel,
  isAdding = false,
}: ConflictDialogProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userCourses = useQuery(api.userCourseOfferings.getUserCourseOfferings);

  const conflictingMainCourses = userCourses?.filter(
    (course) =>
      !course.alternativeOf &&
      conflictingCourses.some(
        (c) => c.classNumber === course.courseOffering.classNumber,
      ),
  );

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      onCancel();
    }
  };

  const handleAddAsAlternative = (courseId: Id<"userCourseOfferings">) => {
    setDropdownOpen(false);
    // Give dropdown time to close and clean up before async operation
    setTimeout(() => {
      onAddAsAlternative(courseId);
    }, 0);
  };

  if (!newCourse) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-2xl [&>button:last-child]:top-6">
        <DialogHeader className="px-6 gap-1 pb-3">
          <DialogTitle className="pt-6 text-xl">
            Schedule Conflict Detected
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-muted-foreground">
              The course you're trying to add conflicts with{" "}
              {conflictingCourses.length} existing course
              {conflictingCourses.length !== 1 ? "s" : ""} in your schedule.
            </p>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96 px-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Course to Add
              </h3>
              <div className="rounded-lg border bg-violet-50 dark:bg-violet-950/30 p-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {newCourse.courseCode}
                    </span>
                    <span className="text-muted-foreground">
                      Section {newCourse.section.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{newCourse.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {newCourse.days
                      .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
                      .join(", ")}{" "}
                    • {newCourse.startTime} - {newCourse.endTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Conflicting Courses */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Conflicting Course{conflictingCourses.length !== 1 ? "s" : ""}
              </h3>
              <div className="space-y-2">
                {conflictingCourses.map((course) => (
                  <div
                    key={course.classNumber}
                    className="rounded-lg border bg-muted/30 p-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {course.courseCode}
                        </span>
                        <span className="text-muted-foreground">
                          Section {course.section.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.days
                          .map(
                            (day) => day.charAt(0).toUpperCase() + day.slice(1),
                          )
                          .join(", ")}{" "}
                        • {course.startTime} - {course.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t px-6 py-4 flex-col sm:flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  disabled={isAdding || !conflictingMainCourses?.length}
                  className="flex-1 justify-center gap-2"
                >
                  <div className="items-center flex flex-row  gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span>Add as Alternative</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-y-auto w-[var(--radix-dropdown-menu-trigger-width)]">
                {conflictingMainCourses?.map((course) => (
                  <DropdownMenuItem
                    key={course._id}
                    onSelect={() => handleAddAsAlternative(course._id)}
                    className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                  >
                    <span className="font-medium text-sm">
                      {course.courseOffering.courseCode} -{" "}
                      {course.courseOffering.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Section {course.courseOffering.section.toUpperCase()} •{" "}
                      {course.courseOffering.instructor.join(", ")}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="outline"
              onClick={onAddAsMain}
              disabled={isAdding}
              className="flex-1"
            >
              <CircleAlertIcon />
              {"Add Anyway"}
            </Button>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isAdding}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
