"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import Selector from "@/app/dashboard/register/components/Selector";
import { useNextTerm, useNextYear } from "@/components/AppConfigProvider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSearchParam } from "@/hooks/use-search-param";
import { CourseSelector } from "@/modules/course-selection";
import CourseSelectorSkeleton from "@/modules/course-selection/components/CourseSelectorSkeleton";
import type {
  CourseOffering,
  CourseOfferingWithCourse,
} from "@/modules/course-selection/types";
import {
  type Class,
  getUserClassesByTerm,
  ScheduleCalendar,
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

  // TODO: save the state to cookie
  const [showAlternatives, setShowAlternatives] = useState(true);

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

  const selectedClassNumbers = allClasses?.map((c) => c.classNumber) || [];

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

  const allClassesForTerm = getUserClassesByTerm(
    allClasses,
    currentYear,
    currentTerm,
  );

  // Filter out alternatives if toggle is off
  const classes = showAlternatives
    ? allClassesForTerm
    : allClassesForTerm?.filter((c) => !c.alternativeOf);

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

  const AltToggle = () => (
    <>
      <Switch
        id="alt-switcher"
        className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
        checked={showAlternatives}
        onCheckedChange={setShowAlternatives}
      />
      <div className="grid grow gap-2">
        <Label htmlFor="alt-switcher">Show alternative courses</Label>
        <p className="text-xs text-muted-foreground">
          You can set one course as alternative for another.
        </p>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-4 w-full">
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
            selectedClassNumbers={selectedClassNumbers}
          />
        ) : (
          <div className="h-full flex flex-col space-y-2">
            <div className="md:hidden relative flex w-full items-start gap-2 rounded-md border border-input p-4 shadow-xs outline-none has-data-[state=checked]:border-primary/50">
              <AltToggle />
            </div>
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
        <div className="flex flex-col space-y-4">
          <div className="relative flex w-full items-start gap-2 rounded-md border border-input p-4 shadow-xs outline-none has-data-[state=checked]:border-primary/50">
            <AltToggle />
          </div>
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
            selectedClassNumbers={selectedClassNumbers}
          />
        </div>

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
