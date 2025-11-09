"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import Selector from "@/app/dashboard/register/components/Selector";
import { useNextTerm, useNextYear } from "@/components/AppConfigProvider";
import { useSearchParam } from "@/hooks/use-search-param";
import { CourseSelector } from "@/modules/course-selection";
import CourseSelectorSkeleton from "@/modules/course-selection/components/CourseSelectorSkeleton";
import type {
  CourseOffering,
  CourseOfferingWithCourse,
} from "@/modules/course-selection/types";
import {
  getUserClassesByTerm,
  ScheduleCalendar,
  type Class,
} from "@/modules/schedule-calendar/schedule-calendar";

const RegisterPage = () => {
  const { isAuthenticated } = useConvexAuth();
  const currentYear = useNextYear();
  const currentTerm = useNextTerm();

  const [hoveredCourse, setHoveredCourse] = useState<CourseOffering | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Class | null>(null);
  const [mobileView, setMobileView] = useState<"selector" | "calendar">(
    "selector",
  );
  const [previousMobileView, setPreviousMobileView] = useState<
    "selector" | "calendar"
  >("selector");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectedCourse && isMobile && mobileView === "calendar") {
      setPreviousMobileView("calendar");
      setMobileView("selector");
    }
  }, [selectedCourse, isMobile, mobileView]);

  const handleCourseSelect = (course: Class | null) => {
    if (!course && isMobile && previousMobileView === "calendar") {
      // When closing detail panel on mobile, return to calendar view
      setMobileView("calendar");
    }
    setSelectedCourse(course);
  };

  // clear selected course when switching tabs
  const handleMobileViewChange = (view: "selector" | "calendar") => {
    setMobileView(view);
    if (view === "calendar" && selectedCourse) {
      setSelectedCourse(null);
    }
  };

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
    <div className="flex flex-col gap-4 h-[calc(100vh-(--spacing(16))-(--spacing(12)))] w-full">
      {/* Mobile toggle buttons */}
      <div className="md:hidden shrink-0 p-2">
        <Selector value={mobileView} onValueChange={handleMobileViewChange} />
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
            selectedCourse={selectedCourse}
            onCourseSelect={handleCourseSelect}
          />
        ) : (
          <div className="h-full">
            <ScheduleCalendar
              classes={classes}
              hoveredCourse={hoveredCourse}
              selectedCourse={selectedCourse}
              onCourseSelect={handleCourseSelect}
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
          selectedCourse={selectedCourse}
          onCourseSelect={handleCourseSelect}
        />

        <div className="flex-1 min-w-0">
          <div className="sticky top-0">
            <ScheduleCalendar
              classes={classes}
              hoveredCourse={hoveredCourse}
              selectedCourse={selectedCourse}
              onCourseSelect={handleCourseSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
