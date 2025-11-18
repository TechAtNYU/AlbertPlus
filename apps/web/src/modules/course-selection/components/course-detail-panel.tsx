"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Class } from "../../schedule-calendar/schedule-calendar";

interface CourseDetailPanelProps {
  course: Class | null;
  onClose: () => void;
  onDelete: (
    id: Id<"userCourseOfferings">,
    classNumber: number,
    title: string,
    alternativeOf?: Id<"userCourseOfferings">,
  ) => void;
}

export function CourseDetailPanel({
  course,
  onClose,
  onDelete,
}: CourseDetailPanelProps) {
  const alternatives = useQuery(
    api.userCourseOfferings.getAlternativeCourses,
    course?.userCourseOfferingId
      ? {
          userCourseOfferingId:
            course.userCourseOfferingId as Id<"userCourseOfferings">,
        }
      : "skip",
  );

  if (!course) return null;

  const handleDelete = () => {
    if (course.userCourseOfferingId && course.classNumber) {
      onDelete(
        course.userCourseOfferingId as Id<"userCourseOfferings">,
        course.classNumber,
        course.title,
        course.alternativeOf as Id<"userCourseOfferings"> | undefined,
      );
      onClose();
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
    <div className="flex h-full flex-col md:border md:rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-6 md:px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
          aria-label="Close course details"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="md:text-base text-lg font-semibold">Course Details</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 md:p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold break-words">
              {/*
              schedule-calendar:171 is making title`${offering.courseCode} - ${offering.title}`
              extract the title only here, or remove the courseCode addition in calendar if safe
*/}
              {course.title.split(" - ").slice(1).join(" - ") || course.title}
            </h3>
          </div>

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
                <p className="text-sm font-semibold text-foreground">Section</p>
                <p className="text-sm text-muted-foreground">
                  {course.section.toUpperCase()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Term</p>
                <p className="text-sm text-muted-foreground">
                  {formatTerm(course.term, course.year)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Instructor
              </p>
              <p className="text-sm text-muted-foreground break-words">
                {course.instructor.join(", ") || "TBA"}
              </p>
            </div>

            {course.location && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Location
                </p>
                <p className="text-sm text-muted-foreground break-words">
                  {course.location}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Schedule</p>
              <div className="space-y-2">
                {course.times.map((slot, index) => (
                  <p
                    key={`${slot.start.toString()}-${index}`}
                    className="text-sm text-muted-foreground break-words"
                  >
                    {formatTimeSlot(slot)}
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Status</p>
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

          {/* Alternatives Section */}
          {alternatives && alternatives.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Alternative Courses
                </h4>
                <div className="space-y-2">
                  {alternatives.map((alt) => (
                    <div
                      key={alt._id}
                      className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium break-words">
                            {alt.courseOffering.courseCode} -{" "}
                            {alt.courseOffering.title}
                          </p>
                          <p className="text-xs text-muted-foreground break-words">
                            Section {alt.courseOffering.section.toUpperCase()} •{" "}
                            {alt.courseOffering.instructor.join(", ")}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(alt.courseOffering.status)}`}
                        >
                          {alt.courseOffering.status.charAt(0).toUpperCase() +
                            alt.courseOffering.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground break-words">
                        {alt.courseOffering.days
                          .map(
                            (day) => day.charAt(0).toUpperCase() + day.slice(1),
                          )
                          .join(", ")}{" "}
                        • {alt.courseOffering.startTime} -{" "}
                        {alt.courseOffering.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {!course.isPreview && course.userCourseOfferingId && (
        <div className="border-t px-6 md:px-6 py-4 md:py-4">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="w-full"
          >
            <Trash2 className="mr-2 size-4" />
            Delete Course
          </Button>
        </div>
      )}
    </div>
  );
}
