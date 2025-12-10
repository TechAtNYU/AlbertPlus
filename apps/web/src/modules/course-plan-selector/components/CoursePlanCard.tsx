import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import { GripVertical, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoursePlanCardProps {
  course: Doc<"courses">;
  onAdd: () => void;
}

const CoursePlanCard = ({ course, onAdd }: CoursePlanCardProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        courseCode: course.code,
        title: course.title,
      }),
    );
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const SCHOOLABBR = {
    "College of Arts and Science": "CAS",
    "Graduate School of Arts and Science": "GSAS",
    "College of Dentistry": "Dentistry",
    "Gallatin School of Individualized Study": "Gallatin",
    "Leonard N. Stern School of Business": "Stern",
    "Liberal Studies": "LS",
    "NYU Abu Dhabi": "NYUAD",
    "NYU Shanghai": "NYUSH",
    "NYU Grossman School of Medicine": "Grossman",
    "NYU Grossman Long Island School of Medicine": "LISOM",
    "Robert F. Wagner Graduate School of Public Service": "Wagner",
    "Rory Meyers College of Nursing": "Nursing",
    "School of Global Public Health": "GPH",
    "School of Law": "Law",
    "School of Professional Studies": "SPS",
    "Silver School of Social Work": "Silver",
    "Steinhardt School of Culture, Education, and Human Development":
      "Steinhardt",
    "Tandon School of Engineering": "Tandon",
    "Tisch School of the Arts": "Tisch",
    "Non-School Based Programs - UG": "NSB",
  };

  return (
    <div className="group border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          aria-label={`Drag ${course.title} to a plan`}
          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-grab active:cursor-grabbing bg-transparent border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-md"
        >
          <GripVertical className="hidden md:block h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{course.title}</h3>
            <div className="flex items-baseline gap-2 mt-1 text-xs text-muted-foreground">
              <span>{course.code}</span>
              <span>•</span>
              <span>
                {course.credits} credit{course.credits > 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span className="capitalize">
                {SCHOOLABBR[course.school] ?? course.school.split(" ")[0]}
              </span>
            </div>
          </div>
        </button>
        {/* on mobile we display add button, desktop can just drag and drop */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onAdd}
          className="block md:hidden shrink-0 h-8 w-8 p-0"
          title="Add to plan"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CoursePlanCard;
