"use client";
import { api } from "@albert-plus/server/convex/_generated/api";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSearchParam } from "@/hooks/use-search-param";
import { CourseCard, CourseFilters } from "./components";
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
}

const CourseSelector = ({
  courseOfferingsWithCourses,
  onHover,
  onSearchChange,
  searchQuery,
  loadMore,
  status,
  isSearching = false,
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

  const [hoveredSection, setHoveredSection] = useState<CourseOffering | null>(
    null,
  );

  const isFiltersExpanded = filtersParam === "true";

  const handleToggleFilters = () => {
    setFiltersParam(isFiltersExpanded ? "" : "true");
  };

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
    gap: 8,
  });

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
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : "Unexpected error occurred";
      toast.error(errorMessage);
    }
  };

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
        <div
          ref={parentRef}
          className="overflow-auto no-scrollbar w-full flex-1 min-h-0"
        >
          <div
            className="relative w-full"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const course = filteredData[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <CourseCard
                    course={course}
                    isExpanded={isExpanded(course.code)}
                    onToggleExpand={toggleCourseExpansion}
                    onSectionSelect={handleSectionSelect}
                    onSectionHover={setHoveredSection}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="flex justify-center py-4 shrink-0">
          <Button onClick={() => loadMore(200)} variant="outline">
            Load More
          </Button>
        </div>
      )}
      {status === "LoadingMore" && (
        <div className="flex justify-center py-4 shrink-0">
          <p className="text-gray-500">Loading more courses...</p>
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
