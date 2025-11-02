"use client";

import type { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { addDays, startOfWeek } from "date-fns";
import type { Term } from "@/components/AppConfigProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekView } from "./components/week-view";

export const EventHeight = 24;
export const EventGap = 4;
export const WeekCellsHeight = 64;
export const StartHour = 7;
export const EndHour = 22;

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface Class {
  id: string;
  userCourseOfferingId?: string;
  classNumber?: number;
  courseCode: string;
  title: string;
  color: string;
  times: TimeSlot[];
  description: string;
  isPreview?: boolean;
  section: string;
  year: number;
  term: "spring" | "summer" | "fall" | "j-term";
  instructor: string[];
  location?: string;
  startTime: string;
  endTime: string;
  status: "open" | "closed" | "waitlist";
  waitlistNum?: number;
  isCorequisite: boolean;
  corequisiteOf?: number;
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange"
  | "teal"
  | "lime"
  | "cyan"
  | "fuchsia"
  | "indigo"
  | "pink";

export const allClassColors: EventColor[] = [
  "sky",
  "amber",
  "violet",
  "rose",
  "emerald",
  "orange",
  "teal",
  "lime",
  "indigo",
  "fuchsia",
  "pink",
  "cyan",
];

export function getUserClassesByTerm(
  classes:
    | FunctionReturnType<typeof api.userCourseOfferings.getUserCourseOfferings>
    | undefined,
  year: number | null,
  term: Term | null,
) {
  if (!year || !term || !classes) {
    return undefined;
  }
  return classes.filter((cls) => {
    return cls.courseOffering.year === year && cls.courseOffering.term === term;
  });
}

export interface ScheduleCalendarProps {
  classes:
    | FunctionReturnType<typeof api.userCourseOfferings.getUserCourseOfferings>
    | undefined;
  hoveredCourse?: Doc<"courseOfferings"> | null;
}

export function ScheduleCalendar({
  classes,
  hoveredCourse,
}: ScheduleCalendarProps) {
  if (!classes) {
    return <Skeleton className="h-full w-full rounded-lg" />;
  }

  let colorIndex = 0;

  const transformedClasses: Class[] = classes.map((c) => {
    const offering = c.courseOffering;
    const startTime = `${offering.startTime.split(":")[0]} ${offering.startTime.split(":")[1]}`;
    const endTime = `${offering.endTime.split(":")[0]} ${offering.endTime.split(":")[1]}`;

    // Format times like "Monday 9 15 11 15"
    const times = offering.days.map((day) => {
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      return `${dayName} ${startTime} ${endTime}`;
    });

    const color = allClassColors[colorIndex % allClassColors.length];
    colorIndex++;

    const slots: { start: Date; end: Date }[] = [];

    // Map weekday names to 0-6 offset from start of week (Sunday = 0)
    const weekdayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    // Get the start of the current week (Sunday)
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday = 0

    for (const slot of times) {
      const parts = slot.split(" ");
      const day = parts[0];
      const startHour = Number(parts[1]);
      const startMinute = Number(parts[2]);
      const endHour = Number(parts[3]);
      const endMinute = Number(parts[4]);

      const dayOffset = weekdayMap[day];
      if (dayOffset === undefined) {
        throw new Error(`Invalid day: ${day}`);
      }

      const date = addDays(startOfCurrentWeek, dayOffset);

      const start = new Date(date);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(date);
      end.setHours(endHour, endMinute, 0, 0);

      slots.push({ start, end });
    }

    return {
      id: offering._id,
      userCourseOfferingId: c._id,
      classNumber: c.classNumber,
      courseCode: offering.courseCode,
      title: `${offering.courseCode} - ${offering.title}`,
      color,
      times: slots,
      description: `${offering.instructor.join(", ")} • ${offering.section.toUpperCase()} • ${offering.term} ${offering.year}`,
      section: offering.section,
      year: offering.year,
      term: offering.term,
      instructor: offering.instructor,
      location: offering.location,
      startTime: offering.startTime,
      endTime: offering.endTime,
      status: offering.status,
      waitlistNum: offering.waitlistNum,
      isCorequisite: offering.isCorequisite,
      corequisiteOf: offering.corequisiteOf,
    };
  });

  // Add hovered course preview
  if (hoveredCourse) {
    const isAlreadyAdded = classes.some(
      (c) => c.courseOffering._id === hoveredCourse._id,
    );

    if (!isAlreadyAdded) {
      const offering = hoveredCourse;
      const startTime = `${offering.startTime.split(":")[0]} ${offering.startTime.split(":")[1]}`;
      const endTime = `${offering.endTime.split(":")[0]} ${offering.endTime.split(":")[1]}`;

      const times = offering.days.map((day) => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        return `${dayName} ${startTime} ${endTime}`;
      });

      const slots: { start: Date; end: Date }[] = [];
      const weekdayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });

      for (const slot of times) {
        const parts = slot.split(" ");
        const day = parts[0];
        const startHour = Number(parts[1]);
        const startMinute = Number(parts[2]);
        const endHour = Number(parts[3]);
        const endMinute = Number(parts[4]);

        const dayOffset = weekdayMap[day];
        if (dayOffset !== undefined) {
          const date = addDays(startOfCurrentWeek, dayOffset);
          const start = new Date(date);
          start.setHours(startHour, startMinute, 0, 0);
          const end = new Date(date);
          end.setHours(endHour, endMinute, 0, 0);
          slots.push({ start, end });
        }
      }

      transformedClasses.push({
        id: `preview-${offering._id}`,
        courseCode: offering.courseCode,
        title: `${offering.courseCode} - ${offering.title}`,
        color: allClassColors[colorIndex % allClassColors.length],
        times: slots,
        description: `${offering.instructor.join(", ")} • ${offering.section.toUpperCase()} • Preview`,
        isPreview: true,
        section: offering.section,
        year: offering.year,
        term: offering.term,
        instructor: offering.instructor,
        location: offering.location,
        startTime: offering.startTime,
        endTime: offering.endTime,
        status: offering.status,
        waitlistNum: offering.waitlistNum,
        isCorequisite: offering.isCorequisite,
        corequisiteOf: offering.corequisiteOf,
      });
    }
  }

  return (
    <div
      className="flex h-full max-h-[calc(100vh-var(--header-height)-2rem)] flex-col overflow-hidden rounded-lg border has-data-[slot=month-view]:flex-1"
      style={
        {
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <WeekView
          classes={transformedClasses}
          hoveredCourseId={hoveredCourse?._id ?? null}
        />
      </div>
    </div>
  );
}
