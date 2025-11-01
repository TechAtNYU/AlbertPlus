"use client";

import { differenceInMinutes, format, getMinutes } from "date-fns";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { Class, EventColor } from "../schedule-calendar";

// Using date-fns format with custom formatting:
// 'h' - hours (1-12)
// 'a' - am/pm
// ':mm' - minutes with leading zero (only if the token 'mm' is present)
const formatTimeWithOptionalMinutes = (date: Date) => {
  return format(date, getMinutes(date) === 0 ? "ha" : "h:mma").toLowerCase();
};

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
    case "amber":
      return "bg-amber-200/50 hover:bg-amber-200/40 text-amber-950/80 dark:bg-amber-400/25 dark:hover:bg-amber-400/20 dark:text-amber-200 shadow-amber-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-950/80 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-950/80 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-emerald-200/50 hover:bg-emerald-200/40 text-emerald-950/80 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20 dark:text-emerald-200 shadow-emerald-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-950/80 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    case "teal":
      return "bg-teal-200/50 hover:bg-teal-200/40 text-teal-950/80 dark:bg-teal-400/25 dark:hover:bg-teal-400/20 dark:text-teal-200 shadow-teal-700/8";
    case "lime":
      return "bg-lime-200/50 hover:bg-lime-200/40 text-lime-950/80 dark:bg-lime-400/25 dark:hover:bg-lime-400/20 dark:text-lime-200 shadow-lime-700/8";
    case "cyan":
      return "bg-cyan-200/50 hover:bg-cyan-200/40 text-cyan-950/80 dark:bg-cyan-400/25 dark:hover:bg-cyan-400/20 dark:text-cyan-200 shadow-cyan-700/8";
    case "fuchsia":
      return "bg-fuchsia-200/50 hover:bg-fuchsia-200/40 text-fuchsia-950/80 dark:bg-fuchsia-400/25 dark:hover:bg-fuchsia-400/20 dark:text-fuchsia-200 shadow-fuchsia-700/8";
    case "indigo":
      return "bg-indigo-200/50 hover:bg-indigo-200/40 text-indigo-950/80 dark:bg-indigo-400/25 dark:hover:bg-indigo-400/20 dark:text-indigo-200 shadow-indigo-700/8";
    case "pink":
      return "bg-pink-200/50 hover:bg-pink-200/40 text-pink-950/80 dark:bg-pink-400/25 dark:hover:bg-pink-400/20 dark:text-pink-200 shadow-pink-700/8";
    default:
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean,
): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none"; // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r rounded-l-none"; // Only right end rounded
  } else {
    return "rounded-none"; // No rounded corners
  }
}

interface EventWrapperProps {
  event: Class;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  currentTime?: Date;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

// Shared wrapper component for event styling
function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  className,
  children,
}: EventWrapperProps) {
  return (
    <div
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex size-full overflow-hidden px-1 text-left font-medium backdrop-blur-md transition outline-none select-none focus-visible:ring-[3px] data-dragging:cursor-grabbing data-dragging:shadow-lg data-past-event:line-through sm:px-2",
        getEventColorClasses(event.color),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        className,
      )}
    >
      {children}
    </div>
  );
}

interface EventItemProps {
  event: Class;
  timeSlotIndex?: number;
  showTime?: boolean;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  className?: string;
  isHovered?: boolean;
}

export function EventItem({
  event,
  showTime,
  isFirstDay = true,
  isLastDay = true,
  className,
  timeSlotIndex,
  isHovered = false,
}: EventItemProps) {
  const displayStart = useMemo(() => {
    if (!event.times || event.times.length === 0) return undefined;
    const index =
      timeSlotIndex != null && timeSlotIndex < event.times.length
        ? timeSlotIndex
        : 0; // default to first slot

    return new Date(event.times[index].start);
  }, [event.times, timeSlotIndex]);

  // Helper function to remove the course code prefix
  function getDisplayTitle(title: string) {
    // Assume prefix is everything before the last space, then last part is the course name
    const parts = title.split(" ");
    return parts.slice(3).join(" ");
  }

  function getCourseCode(title: string) {
    const parts = title.split(" ");
    return `${parts[0]} ${parts[1]}`;
  }

  const displayEnd = useMemo(() => {
    if (!event.times || event.times.length === 0) return undefined;
    const index =
      timeSlotIndex != null && timeSlotIndex < event.times.length
        ? timeSlotIndex
        : 0; // default to first slot

    return new Date(event.times[index].end);
  }, [event.times, timeSlotIndex]);

  // Calculate duration in minutes
  const durationMinutes = useMemo(() => {
    if (!displayStart || !displayEnd) return 0;
    return differenceInMinutes(displayEnd, displayStart);
  }, [displayStart, displayEnd]);

  const getEventTime = () => {
    if (!displayStart || !displayEnd) return "";

    // For short events (less than 45 minutes), only show start time
    if (durationMinutes < 45) {
      return formatTimeWithOptionalMinutes(displayStart);
    }

    // For longer events, show both start and end time
    return `${formatTimeWithOptionalMinutes(displayStart)} - ${formatTimeWithOptionalMinutes(displayEnd)}`;
  };

  return (
    <EventWrapper
      event={event}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
      className={cn(
        "py-1 flex flex-col h-full relative",
        durationMinutes < 45 ? "items-center" : "items-start",
        "text-[10px] sm:text-xs",
        isHovered && !event.isPreview && "scale-105 shadow-lg z-50",
        event.isPreview && "opacity-50 z-40",
        className,
      )}
    >
      {event.isPreview && (
        <div className="absolute inset-0 border border-dashed rounded pointer-events-none" />
      )}
      {durationMinutes < 45 ? (
        <div className="truncate">
          {getDisplayTitle(event.title)}{" "}
          {showTime && displayStart && (
            <span className="opacity-70">
              {formatTimeWithOptionalMinutes(displayStart)}
            </span>
          )}
        </div>
      ) : (
        <>
          <div
            className="font-medium overflow-hidden text-ellipsis line-clamp-3"
            title={getDisplayTitle(event.title)}
          >
            {getDisplayTitle(event.title)}
          </div>
          {/* <div className="font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[115px]">{getDisplayTitle(event.title)}</div> */}
          <div className="truncate font-normal opacity-70 sm:text-[11px]">
            {getCourseCode(event.title)}
          </div>
          {showTime && (
            <div className="truncate font-normal opacity-70 sm:text-[11px]">
              {getEventTime()}
            </div>
          )}
        </>
      )}
    </EventWrapper>
  );
}
