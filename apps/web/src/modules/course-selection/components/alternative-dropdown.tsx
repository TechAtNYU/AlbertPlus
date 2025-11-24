"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronDownIcon } from "lucide-react";
import { useNextTerm, useNextYear } from "@/components/AppConfigProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AlternativeDropdownProps {
  onSelect: (userCourseOfferingId: Id<"userCourseOfferings">) => void;
}

export function AlternativeDropdown({ onSelect }: AlternativeDropdownProps) {
  const term = useNextTerm();
  const year = useNextYear();
  const userCourses = useQuery(api.userCourseOfferings.getUserCourseOfferings);

  // Filter out courses that are alternatives themselves and only show courses from the same term/year
  const mainCourses = userCourses?.filter(
    (course) =>
      !course.alternativeOf &&
      course.courseOffering.term === term &&
      course.courseOffering.year === year,
  );

  if (!mainCourses || mainCourses.length === 0) {
    return (
      <Button variant="outline" disabled className="w-full">
        No courses to add alternative to
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          Select course to add alternative to
          <ChevronDownIcon
            className="-me-1 ms-2 opacity-60"
            size={16}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-(--radix-dropdown-menu-trigger-width) max-h-[300px] overflow-y-auto">
        {mainCourses.map((course) => (
          <DropdownMenuItem
            key={course._id}
            onSelect={() => onSelect(course._id)}
            className="flex flex-col items-start gap-1 py-2"
          >
            <span className="font-medium text-sm">
              {course.courseOffering.courseCode} - {course.courseOffering.title}
            </span>
            <span className="text-xs text-muted-foreground">
              Section {course.courseOffering.section.toUpperCase()} •{" "}
              {course.courseOffering.instructors.join(", ")}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
