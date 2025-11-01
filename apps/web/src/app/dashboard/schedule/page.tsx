"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { CourseSelector } from "@/app/dashboard/schedule/components/course-selection";
import CourseSelectorSkeleton from "@/app/dashboard/schedule/components/course-selection/components/CourseSelectorSkeleton";
import type {
  CourseOffering,
  CourseOfferingWithCourse,
} from "@/app/dashboard/schedule/components/course-selection/types";
import Selector from "@/app/dashboard/schedule/components/Selector";
import {
  type Term,
  useCurrentTerm,
  useCurrentYear,
} from "@/components/AppConfigProvider";
import { useSearchParam } from "@/hooks/use-search-param";
import { formatTermTitle } from "@/utils/format-term";
import { ScheduleCalendar } from "./components/schedule-calendar";

function getUserClassesByTerm(
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

const SchedulePage = () => {
  const { isAuthenticated } = useConvexAuth();
  const currentYear = useCurrentYear();
  const currentTerm = useCurrentTerm();

  const [hoveredCourse, setHoveredCourse] = useState<CourseOffering | null>(
    null,
  );
  const [mobileView, setMobileView] = useState<"selector" | "calendar">(
    "selector",
  );

  // Search param state with debouncing and URL sync
  const { searchValue, setSearchValue, debouncedSearchValue } = useSearchParam({
    paramKey: "q",
  });

  // Keep track of displayed results to prevent flashing when searching
  const [displayedResults, setDisplayedResults] = useState<
    CourseOfferingWithCourse[]
  >([]);
  const prevSearchRef = useRef(debouncedSearchValue);

  const allClasses = useQuery(
    api.userCourseOfferings.getUserCourseOfferings,
    isAuthenticated ? {} : "skip",
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.courseOfferings.getCourseOfferings,
    isAuthenticated && currentTerm && currentYear
      ? {
          term: currentTerm,
          year: currentYear,
          query: debouncedSearchValue || undefined,
        }
      : "skip",
    { initialNumItems: 500 },
  );

  // Update displayed results when new results are loaded (including empty results)
  useEffect(() => {
    if (status !== "LoadingFirstPage") {
      setDisplayedResults(results);
      prevSearchRef.current = debouncedSearchValue;
    }
  }, [results, debouncedSearchValue, status]);

  const title = formatTermTitle(currentTerm, currentYear);

  const classes = getUserClassesByTerm(allClasses, currentYear, currentTerm);

  const isSearching =
    status === "LoadingFirstPage" &&
    prevSearchRef.current !== debouncedSearchValue &&
    prevSearchRef.current !== "";

  // Only show skeleton on true initial load (not when searching)
  if (
    status === "LoadingFirstPage" &&
    displayedResults.length === 0 &&
    !isSearching
  ) {
    return <CourseSelectorSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] w-full">
      {/* Mobile toggle buttons */}
      <div className="md:hidden shrink-0 p-2">
        <Selector value={mobileView} onValueChange={setMobileView} />
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex-1 min-h-0">
        {mobileView === "selector" ? (
          <CourseSelector
            courseOfferingsWithCourses={displayedResults}
            onHover={setHoveredCourse}
            onSearchChange={setSearchValue}
            searchQuery={searchValue}
            loadMore={loadMore}
            status={status}
            isSearching={isSearching}
          />
        ) : (
          <div className="h-full">
            <ScheduleCalendar
              classes={classes}
              title={title}
              hoveredCourse={hoveredCourse}
            />
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex gap-4 flex-1 min-h-0">
        <CourseSelector
          courseOfferingsWithCourses={displayedResults}
          onHover={setHoveredCourse}
          onSearchChange={setSearchValue}
          searchQuery={searchValue}
          loadMore={loadMore}
          status={status}
          isSearching={isSearching}
        />

        <div className="flex-1 min-w-0">
          <div className="sticky top-0">
            <ScheduleCalendar
              classes={classes}
              title={title}
              hoveredCourse={hoveredCourse}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
