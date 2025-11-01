import clsx from "clsx";
import { ChevronDown, ChevronRight, InfoIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { CourseOffering, CourseWithOfferings } from "../types";
import { CourseSectionItem } from "./CourseSectionItem";

interface CourseCardProps {
  course: CourseWithOfferings;
  isExpanded: boolean;
  onToggleExpand: (courseCode: string) => void;
  onSectionSelect?: (offering: CourseOffering) => void;
  onSectionHover?: (offering: CourseOffering | null) => void;
}

export const CourseCard = ({
  course,
  isExpanded,
  onToggleExpand,
  onSectionSelect,
  onSectionHover,
}: CourseCardProps) => {
  return (
    <div className="w-full">
      <Card
        className={clsx(
          !isExpanded && "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        )}
        onClick={() => onToggleExpand(course.code)}
      >
        <CardHeader className="cursor-pointer">
          <div className="flex w-full items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="shrink-0 rounded p-1">
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </div>
              <CardTitle className="truncate min-w-0" title={course.title}>
                {course.title}
              </CardTitle>
            </div>
            <HoverCard openDelay={10}>
              <HoverCardTrigger>
                <InfoIcon className="size-4 shrink-0 text-blue-400" />
              </HoverCardTrigger>
              <HoverCardContent>{course.description}</HoverCardContent>
            </HoverCard>
          </div>
          <CardDescription className="flex flex-row gap-1 flex-wrap text-sm">
            <span>{course.code}</span>
            <span>&middot;</span>
            <span>{course.credits} credit</span>
            <span>&middot;</span>
            <span>{course.level}</span>
            {course.offerings.length > 0 && (
              <>
                <span>&middot;</span>
                <span>
                  {course.offerings.length} section
                  {course.offerings.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </CardDescription>
        </CardHeader>

        {/* Course Sections */}
        {isExpanded && course.offerings.length > 0 && (
          <CardContent
            className="space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {course.offerings.map((offering) => (
              <CourseSectionItem
                key={offering._id}
                offering={offering}
                onSelect={onSectionSelect}
                onHover={onSectionHover}
              />
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
