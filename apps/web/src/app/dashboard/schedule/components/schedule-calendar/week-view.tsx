"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type Class,
  EndHour,
  StartHour,
  type TimeSlot,
  WeekCellsHeight,
} from "../schedule-calendar";
import { EventItem } from "./event-item";
import { CourseInfoDialog } from "./info-dialog";

interface WeekViewProps {
  classes: Class[];
  hoveredCourseId?: string | null;
}

interface PositionedEvent {
  event: Class;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
  timeSlotIndex: number;
}

export function WeekView({
  classes,
  hoveredCourseId: externalHoveredCourseId,
}: WeekViewProps) {
  const currentDate = new Date();
  const [internalHoveredCourseId, setInternalHoveredCourseId] = useState<
    string | null
  >(null);
  const [selectedCourse, setSelectedCourse] = useState<Class | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Combine external hover (from selector) and internal hover (from calendar)
  const hoveredCourseId = externalHoveredCourseId ?? internalHoveredCourseId;

  const removeOffering = useMutation(
    api.userCourseOfferings.removeUserCourseOffering,
  );

  const addOffering = useMutation(
    api.userCourseOfferings.addUserCourseOffering,
  );

  const handleRemove = async (
    id: Id<"userCourseOfferings">,
    classNumber: number,
    title: string,
  ) => {
    try {
      await removeOffering({ id });
      toast.success(`${title} removed`, {
        action: {
          label: "Undo",
          onClick: () => addOffering({ classNumber }),
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : "Unexpected error occurred";
      toast.error(errorMessage);
    }
  };

  const handleEventClick = (event: Class) => {
    setSelectedCourse(event);
    setDialogOpen(true);
  };

  const allDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Filter out Saturday and Sunday if they have no classes
  const days = useMemo(() => {
    const daysWithClasses = new Set<number>();

    classes.forEach((event) => {
      if (!event.times?.length) return;
      event.times.forEach((slot) => {
        const start = new Date(slot.start);
        daysWithClasses.add(start.getDay());
      });
    });

    return allDays.filter((day) => {
      const dayOfWeek = day.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) return true;
      return daysWithClasses.has(dayOfWeek);
    });
  }, [allDays, classes]);

  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    });
  }, [currentDate]);

  const processedDayEvents = useMemo(() => {
    return days.map((day) => {
      const dayEvents: { event: Class; slot: TimeSlot }[] = [];

      classes.forEach((event) => {
        if (!event.times?.length) return;
        event.times.forEach((slot) => {
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          if (
            isSameDay(day, start) ||
            isSameDay(day, end) ||
            (start < day && end > day)
          ) {
            dayEvents.push({ event, slot });
          }
        });
      });

      // Sort by start time, then by duration
      const sortedEvents = dayEvents.sort((a, b) => {
        const aStart = new Date(a.slot.start);
        const bStart = new Date(b.slot.start);
        if (aStart < bStart) return -1;
        if (aStart > bStart) return 1;

        const aDuration = differenceInMinutes(new Date(a.slot.end), aStart);
        const bDuration = differenceInMinutes(new Date(b.slot.end), bStart);
        return bDuration - aDuration;
      });

      const positionedEvents: PositionedEvent[] = [];
      const dayStart = startOfDay(day);
      const columns: { event: Class; end: Date }[][] = [];

      sortedEvents.forEach(({ event, slot }) => {
        const eventStart = new Date(slot.start);
        const eventEnd = new Date(slot.end);

        const adjustedStart = isSameDay(day, eventStart)
          ? eventStart
          : dayStart;
        const adjustedEnd = isSameDay(day, eventEnd)
          ? eventEnd
          : addHours(dayStart, 24);

        const startHour =
          getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
        const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;

        const top = (startHour - StartHour) * WeekCellsHeight;
        const height = (endHour - startHour) * WeekCellsHeight;

        // Find column logic...
        let columnIndex = 0;
        let placed = false;
        while (!placed) {
          const col = columns[columnIndex] || [];
          if (col.length === 0) {
            columns[columnIndex] = col;
            placed = true;
          } else {
            const overlaps = col.some((c) =>
              areIntervalsOverlapping(
                { start: adjustedStart, end: adjustedEnd },
                {
                  start: new Date(c.event.times[0].start),
                  end: new Date(c.event.times[0].end),
                },
              ),
            );
            if (!overlaps) {
              placed = true;
            } else {
              columnIndex++;
            }
          }
        }

        const currentColumn = columns[columnIndex] || [];
        columns[columnIndex] = currentColumn;
        currentColumn.push({ event, end: adjustedEnd });

        const slotIndex = event.times.indexOf(slot);

        positionedEvents.push({
          event,
          top,
          height,
          left: columnIndex === 0 ? 0 : columnIndex * 0.1,
          width: columnIndex === 0 ? 1 : 0.9,
          zIndex: 10 + columnIndex,
          timeSlotIndex: slotIndex, // use correct slot
        });
      });

      return positionedEvents;
    });
  }, [days, classes]);

  const gridCols = days.length + 1; // +1 for the time column

  return (
    <div data-slot="week-view" className="flex min-h-0 flex-1 flex-col">
      <div
        className="bg-background/80 border-border/70 sticky top-0 z-30 grid shrink-0 border-b backdrop-blur-md"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        <div className="text-muted-foreground/70 py-2 text-center text-sm">
          <span className="max-[479px]:sr-only">{format(new Date(), "O")}</span>
        </div>
        {days.map((day) => (
          <div
            key={day.toString()}
            className="data-today:text-foreground text-muted-foreground/70 py-2 text-center text-sm data-today:font-medium"
            data-today={isToday(day) || undefined}
          >
            <span className="sm:hidden" aria-hidden="true">
              {format(day, "E")[0]} {format(day, "d")}
            </span>
            <span className="max-sm:hidden">{format(day, "EEEE")}</span>
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 overflow-y-auto no-scrollbar"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        <div className="border-border/70 grid auto-cols-fr border-r">
          {hours.map((hour, index) => (
            <div
              key={hour.toString()}
              className="border-border/70 relative min-h-[var(--week-cells-height)] border-b last:border-b-0"
            >
              {index > 0 && (
                <span className="bg-background text-muted-foreground/70 absolute -top-3 left-0 flex h-6 w-16 max-w-full items-center justify-end pe-2 text-[10px] sm:pe-4 sm:text-xs">
                  {format(hour, "h a")}
                </span>
              )}
            </div>
          ))}
        </div>

        {days.map((day, dayIndex) => (
          <div
            key={day.toString()}
            className="border-border/70 relative grid auto-cols-fr border-r last:border-r-0"
            data-today={isToday(day) || undefined}
          >
            {hours.map((hour) => (
              <div
                key={hour.toString()}
                className="border-border/70 relative border-b last:border-b-0"
              />
            ))}
            {(processedDayEvents[dayIndex] ?? []).map((positionedEvent) => {
              const courseOfferingId = positionedEvent.event.id.replace(
                "preview-",
                "",
              );
              const isHovered = hoveredCourseId === courseOfferingId;
              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: change div to button will cause hydration error
                <div
                  key={positionedEvent.event.id}
                  className="absolute z-10 px-0.5 cursor-pointer"
                  style={{
                    top: `${positionedEvent.top}px`,
                    height: `${positionedEvent.height}px`,
                    left: `${positionedEvent.left * 100}%`,
                    width: `${positionedEvent.width * 100}%`,
                    zIndex: positionedEvent.zIndex,
                  }}
                  onMouseEnter={() =>
                    setInternalHoveredCourseId(courseOfferingId)
                  }
                  onMouseLeave={() => setInternalHoveredCourseId(null)}
                  onClick={() => handleEventClick(positionedEvent.event)}
                  // biome lint/a11y/useKeyWithClickEvents
                  onKeyDown={() => {}}
                >
                  <div className="relative size-full group">
                    <EventItem
                      event={positionedEvent.event}
                      timeSlotIndex={positionedEvent.timeSlotIndex}
                      showTime
                      isHovered={isHovered}
                    />
                    {positionedEvent.event.userCourseOfferingId &&
                      positionedEvent.event.classNumber && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!positionedEvent.event.classNumber) {
                              return null;
                            }
                            handleRemove(
                              positionedEvent.event
                                .userCourseOfferingId as Id<"userCourseOfferings">,
                              positionedEvent.event.classNumber,
                              positionedEvent.event.title,
                            );
                          }}
                          className="absolute right-1 top-1 z-50 flex size-5 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-foreground/70 opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-black/20 dark:hover:bg-white/20 hover:text-foreground hover:scale-110 group-hover:opacity-100"
                          aria-label="Remove course"
                        >
                          <X className="size-3.5 stroke-[2.5]" />
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <CourseInfoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={selectedCourse}
        onDelete={handleRemove}
      />
    </div>
  );
}
