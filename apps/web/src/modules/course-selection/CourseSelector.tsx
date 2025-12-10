"use client";
import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSearchParam } from "@/hooks/use-search-param";
import { type Class, CourseDetailPanel } from "@/modules/schedule-calendar";
import { ConflictDialog, CourseCard, CourseFilters } from "./components";
import { useCourseExpansion, useCourseFiltering } from "./hooks";
import type { CourseOffering, CourseOfferingWithCourse } from "./types";

interface CourseSelectorComponentProps {
  courseOfferingsWithCourses: CourseOfferingWithCourse[];
  onHover: (course: CourseOffering | null) => void;
  onSearchChange: (search: string) => void;
  searchQuery: string;
  loadMore: (numItems: number) => void;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  isSearching?: boolean;
  selectedCourse?: Class | null;
  onCourseSelect?: (course: Class | null) => void;
  selectedClassNumbers?: number[];
}

const CourseSelector = ({
  courseOfferingsWithCourses,
  onHover,
  onSearchChange,
  searchQuery,
  loadMore,
  status,
  isSearching = false,
  selectedCourse,
  onCourseSelect,
  selectedClassNumbers,
}: CourseSelectorComponentProps) => {
  const { searchValue: filtersParam, setSearchValue: setFiltersParam } =
    useSearchParam({ paramKey: "filters", debounceDelay: 0 });

  const { filterState, dispatch, filteredData, availableCredits } =
    useCourseFiltering(courseOfferingsWithCourses);
  const { creditFilter, selectedDays } = filterState;

  const { toggleCourseExpansion, isExpanded } = useCourseExpansion();

  const addCourseOffering = useMutation(
    api.userCourseOfferings.addUserCourseOffering,
  );

  const removeCourseOffering = useMutation(
    api.userCourseOfferings.removeUserCourseOffering,
  );

  const swapWithAlternative = useMutation(
    api.userCourseOfferings.swapWithAlternative,
  );

  const [hoveredSection, setHoveredSection] = useState<CourseOffering | null>(
    null,
  );

  const [conflictState, setConflictState] = useState<{
    course: CourseOffering | null;
    conflictingClassNumbers: number[];
  } | null>(null);

  const [isAddingWithConflict, setIsAddingWithConflict] = useState(false);

  const conflictingCourses = useQuery(
    api.userCourseOfferings.getCourseOfferingsByClassNumbers,
    conflictState?.conflictingClassNumbers
      ? { classNumbers: conflictState.conflictingClassNumbers }
      : "skip",
  );

  const isFiltersExpanded = filtersParam === "true";

  const handleToggleFilters = () => {
    setFiltersParam(isFiltersExpanded ? "" : "true");
  };

  const handleSectionHover = (section: CourseOffering | null) => {
    if (section && (!section.startTime || !section.endTime)) {
      setHoveredSection(null);
      return;
    }
    setHoveredSection(section);
  };

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore") {
          loadMore(200);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [status, loadMore]);

  useEffect(() => {
    onHover?.(hoveredSection);
  }, [hoveredSection, onHover]);

  const handleSectionSelect = async (offering: CourseOffering) => {
    if (offering.status === "closed") {
      toast.error("This section is closed.");
      return;
    }
    setHoveredSection(null);
    try {
      const id = await addCourseOffering({ classNumber: offering.classNumber });
      toast.success(`${offering.courseCode} ${offering.section} added`, {
        action: {
          label: "Undo",
          onClick: () => removeCourseOffering({ id }),
        },
      });
    } catch (error) {
      if (error instanceof ConvexError) {
        const errorData = error.data as
          | string
          | { type: string; conflictingClassNumbers: number[] };

        if (
          typeof errorData === "object" &&
          errorData.type === "TIME_CONFLICT"
        ) {
          setConflictState({
            course: offering,
            conflictingClassNumbers: errorData.conflictingClassNumbers,
          });
          return;
        }

        toast.error(
          typeof errorData === "string" ? errorData : "An error occurred",
        );
      } else {
        toast.error("Unexpected error occurred");
      }
    }
  };

  const handleSectionSelectAsAlternative = async (
    offering: CourseOffering,
    alternativeOf: Id<"userCourseOfferings">,
  ) => {
    if (offering.status === "closed") {
      toast.error("This section is closed.");
      return;
    }
    setHoveredSection(null);
    try {
      const id = await addCourseOffering({
        classNumber: offering.classNumber,
        alternativeOf,
      });
      toast.success(
        `${offering.courseCode} ${offering.section} added as alternative`,
        {
          action: {
            label: "Undo",
            onClick: () => removeCourseOffering({ id }),
          },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : "Unexpected error occurred";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (
    id: Id<"userCourseOfferings">,
    classNumber: number,
    title: string,
    alternativeOf?: Id<"userCourseOfferings">,
  ) => {
    try {
      await removeCourseOffering({ id });
      toast.success(`${title} removed`, {
        action: {
          label: "Undo",
          onClick: () =>
            addCourseOffering(
              alternativeOf ? { classNumber, alternativeOf } : { classNumber },
            ),
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

  const handleSwap = async (alternativeId: Id<"userCourseOfferings">) => {
    try {
      await swapWithAlternative({ alternativeId });
    } catch (error) {
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : "Unexpected error occurred";
      toast.error(errorMessage);
    }
  };

  const handleConflictAddAsMain = async () => {
    if (!conflictState?.course) return;

    setIsAddingWithConflict(true);
    try {
      const classNumber = conflictState.course.classNumber;
      const courseCode = conflictState.course.courseCode;
      const section = conflictState.course.section;
      const id = await addCourseOffering({
        classNumber,
        forceAdd: true,
      });
      toast.success(`${courseCode} ${section} added`, {
        action: {
          label: "Undo",
          onClick: () => removeCourseOffering({ id }),
        },
      });
      setConflictState(null);
    } catch (error) {
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : "Unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsAddingWithConflict(false);
    }
  };

  const handleConflictAddAsAlternative = async (
    alternativeOf: Id<"userCourseOfferings">,
  ) => {
    if (!conflictState?.course) return;

    setIsAddingWithConflict(true);
    try {
      const id = await addCourseOffering({
        classNumber: conflictState.course.classNumber,
        alternativeOf,
      });
      toast.success(
        `${conflictState.course.courseCode} ${conflictState.course.section} added as alternative`,
        {
          action: {
            label: "Undo",
            onClick: () => removeCourseOffering({ id }),
          },
        },
      );
      setConflictState(null);
    } catch (error) {
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : "Unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsAddingWithConflict(false);
    }
  };

  const handleConflictCancel = () => {
    setConflictState(null);
  };

  if (selectedCourse) {
    return (
      <div className="w-full md:w-[350px] h-full">
        <CourseDetailPanel
          course={selectedCourse}
          onClose={() => onCourseSelect?.(null)}
          onDelete={handleDelete}
          onSwap={handleSwap}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full md:w-[350px] h-full">
      <div className="shrink-0">
        <CourseFilters
          searchInput={searchQuery}
          onSearchChange={onSearchChange}
          creditFilter={creditFilter}
          onCreditFilterChange={(credit) =>
            dispatch({ type: "SET_CREDIT", payload: credit })
          }
          selectedDays={selectedDays}
          onSelectedDaysChange={(days) =>
            dispatch({ type: "SET_DAYS", payload: days })
          }
          availableCredits={availableCredits}
          isExpanded={isFiltersExpanded}
          onToggleExpand={handleToggleFilters}
        />
      </div>

      {filteredData.length === 0 && !isSearching && (
        <div className="flex flex-col space-y-4 items-center justify-center flex-1">
          <p className="text-gray-500">No courses found.</p>
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: "RESET_FILTERS" });
              onSearchChange("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {filteredData.length === 0 && isSearching && (
        <div className="flex flex-col space-y-4 items-center justify-center flex-1">
          <p className="text-gray-500">Searching...</p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div className="overflow-auto no-scrollbar w-full flex-1 min-h-0 space-y-2">
          {filteredData.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              isExpanded={isExpanded(course.code)}
              selectedClassNumbers={selectedClassNumbers}
              onToggleExpand={toggleCourseExpansion}
              onSectionSelect={handleSectionSelect}
              onSectionSelectAsAlternative={handleSectionSelectAsAlternative}
              onSectionHover={handleSectionHover}
            />
          ))}
          <div ref={observerTarget} className="h-1" />
        </div>
      )}

      {status === "LoadingMore" && (
        <div className="flex justify-center py-4 shrink-0">
          <p className="text-gray-500">Loading more courses...</p>
        </div>
      )}

      <ConflictDialog
        open={!!conflictState}
        onOpenChange={(open) => {
          if (!open) setConflictState(null);
        }}
        newCourse={conflictState?.course ?? null}
        conflictingCourses={conflictingCourses?.filter((c) => c !== null) ?? []}
        onAddAsMain={handleConflictAddAsMain}
        onAddAsAlternative={handleConflictAddAsAlternative}
        onCancel={handleConflictCancel}
        isAdding={isAddingWithConflict}
      />
    </div>
  );
};

export default CourseSelector;
