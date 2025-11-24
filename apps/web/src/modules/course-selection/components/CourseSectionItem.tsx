"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import clsx from "clsx";
import { useQuery } from "convex/react";
import { CalendarPlus, ChevronDownIcon, GitBranch } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CourseOffering } from "../types";

interface CourseSectionItemProps {
  offering: CourseOffering;
  selectedClassNumbers?: number[];
  onSelect?: (offering: CourseOffering) => void;
  onSelectAsAlternative?: (
    offering: CourseOffering,
    alternativeOf: Id<"userCourseOfferings">,
  ) => void;
  onHover?: (offering: CourseOffering | null) => void;
}

export const CourseSectionItem = ({
  offering,
  selectedClassNumbers,
  onSelect,
  onSelectAsAlternative,
  onHover,
}: CourseSectionItemProps) => {
  const [showSelector, setShowSelector] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] =
    useState<Id<"userCourseOfferings"> | null>(null);

  const handleClick = () => {
    if (offering.status === "closed") return;
    setShowSelector(true);
  };

  const handleAddToCalendar = () => {
    onSelect?.(offering);
    setShowSelector(false);
  };

  const handleAddAsAlternative = (courseId?: Id<"userCourseOfferings">) => {
    const idToUse = courseId || selectedCourseId;
    if (idToUse) {
      onSelectAsAlternative?.(offering, idToUse);
      setDropdownOpen(false);
      setShowSelector(false);
      setSelectedCourseId(null);
    }
  };

  const userCourses = useQuery(api.userCourseOfferings.getUserCourseOfferings);

  // Filter out courses that are alternatives themselves
  const mainCourses = userCourses?.filter((course) => !course.alternativeOf);

  const isSelected = selectedClassNumbers?.includes(offering.classNumber);

  return (
    <>
      {/** biome-ignore lint/a11y/useSemanticElements: button inside button will cause hydration error */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onMouseEnter={() => {
          if (offering.status === "closed") return;
          onHover?.(offering);
          setShowSelector(true);
        }}
        onMouseLeave={() => {
          onHover?.(null);
          // Don't close if dropdown is open
          if (!dropdownOpen) {
            setShowSelector(false);
          }
        }}
        onKeyDown={() => {}}
        className={clsx(
          "w-full text-left p-3 rounded-lg border transition-colors relative",
          offering.status === "closed"
            ? "cursor-not-allowed hover:bg-neutral-50/0"
            : "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800",
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">
            Section {offering.section}
          </span>
          <div className="flex items-center gap-2">
            {isSelected && (
              <span
                className="text-xs px-2 py-1 rounded-full font-medium bg-violet-100 text-violet-800 dark:bg-violet-900
  dark:text-violet-200"
              >
                Selected
              </span>
            )}
            <span
              className={clsx(
                "text-xs px-2 py-1 rounded-full font-medium capitalize",
                offering.status === "open" && "bg-green-100 text-green-800",
                offering.status === "closed" && "bg-red-100 text-red-800",
                offering.status === "waitlist" &&
                  "bg-yellow-100 text-yellow-800",
              )}
            >
              {offering.status === "waitlist"
                ? `Waitlist (${offering.waitlistNum || 0})`
                : offering.status}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>{offering.instructors.join(", ")}</div>
          <div>
            {offering.startTime && offering.endTime ? (
              <>
                {offering.days
                  .map((day) => day.slice(0, 3).toUpperCase())
                  .join(", ")}{" "}
                {offering.startTime} - {offering.endTime}
              </>
            ) : (
              <span className="italic">Time not available yet</span>
            )}
          </div>
          <div>{offering.location ?? "TBD"}</div>
          <div className="capitalize">
            {offering.term} {offering.year}
          </div>
        </div>
        {showSelector && (
          <>
            <div className="hidden dark:block dark:absolute inset-0 bg-black rounded-lg opacity-90" />
            <div className="absolute inset-0 flex flex-col rounded-lg  ">
              <Button
                onClick={handleAddToCalendar}
                className="w-full justify-start gap-3 h-1/2 cursor-pointer "
                variant="outline"
              >
                <CalendarPlus className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Add to Calendar</span>
                </div>
              </Button>

              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="w-full justify-between gap-3 h-1/2 py-4 cursor-pointer"
                    variant="outline"
                  >
                    <div className="items-center flex flex-row gap-3">
                      <GitBranch className="h-5 w-5" />
                      <span className="font-semibold">Add as Alternative</span>
                    </div>
                    <ChevronDownIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className=" max-h-[300px] overflow-y-auto">
                  {mainCourses?.length === 0 && (
                    <DropdownMenuItem className="flex flex-col items-start py-2 cursor-default">
                      <span className="font-medium text-sm">
                        Please add a course first.
                      </span>
                    </DropdownMenuItem>
                  )}
                  {mainCourses?.map((course) => (
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
                        {course.courseOffering.instructors.join(", ")}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </>
  );
};
