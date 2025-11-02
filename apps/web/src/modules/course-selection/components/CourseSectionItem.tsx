import clsx from "clsx";
import type { CourseOffering } from "../types";

interface CourseSectionItemProps {
  offering: CourseOffering;
  onSelect?: (offering: CourseOffering) => void;
  onHover?: (offering: CourseOffering | null) => void;
}

export const CourseSectionItem = ({
  offering,
  onSelect,
  onHover,
}: CourseSectionItemProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(offering)}
      onMouseEnter={() => onHover?.(offering)}
      onMouseLeave={() => onHover?.(null)}
      className={clsx(
        "w-full text-left p-3 rounded-lg border transition-colors",
        offering.status === "closed"
          ? "cursor-not-allowed hover:bg-neutral-50/0"
          : "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">
          Section {offering.section}
        </span>
        <span
          className={clsx(
            "text-xs px-2 py-1 rounded-full font-medium capitalize",
            offering.status === "open" && "bg-green-100 text-green-800",
            offering.status === "closed" && "bg-red-100 text-red-800",
            offering.status === "waitlist" && "bg-yellow-100 text-yellow-800",
          )}
        >
          {offering.status === "waitlist"
            ? `Waitlist (${offering.waitlistNum || 0})`
            : offering.status}
        </span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>{offering.instructor}</div>
        <div>
          {offering.days.map((day) => day.slice(0, 3).toUpperCase()).join(", ")}{" "}
          {offering.startTime} - {offering.endTime}
        </div>
        <div>{offering.location}</div>
        <div className="capitalize">
          {offering.term} {offering.year}
        </div>
      </div>
    </button>
  );
};
