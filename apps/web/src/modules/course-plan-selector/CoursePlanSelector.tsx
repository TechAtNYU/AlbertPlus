"use client";
import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSearchParam } from "@/hooks/use-search-param";
import CoursePlanCard from "./components/CoursePlanCard";
import CoursePlanFilters from "./components/CoursePlanFilters";
import TermYearSelector from "./components/TermYearSelector";

interface CoursePlanSelectorProps {
  courses: Doc<"courses">[];
  student:
    | FunctionReturnType<typeof api.students.getCurrentStudent>
    | undefined;
  onSearchChange: (search: string) => void;
  searchQuery: string;
  loadMore: (numItems: number) => void;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  isSearching?: boolean;
}

const CoursePlanSelector = ({
  courses,
  student,
  onSearchChange,
  searchQuery,
  loadMore,
  status,
  isSearching = false,
}: CoursePlanSelectorProps) => {
  const { searchValue: filtersParam, setSearchValue: setFiltersParam } =
    useSearchParam({ paramKey: "filters", debounceDelay: 0 });

  const [creditFilter, setCreditFilter] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Doc<"courses"> | null>(
    null,
  );

  const createUserCourse = useMutation(api.userCourses.createUserCourse);
  const deleteUserCourse = useMutation(api.userCourses.deleteUserCourse);

  const isFiltersExpanded = filtersParam === "true";

  const handleToggleFilters = () => {
    setFiltersParam(isFiltersExpanded ? "" : "true");
  };

  const filteredCourses = creditFilter
    ? courses.filter((course) => course.credits === creditFilter)
    : courses;

  const [availableCredits, setAvailableCredits] = useState<number[]>([]);

  useEffect(() => {
    if (status === "LoadingFirstPage") {
      setAvailableCredits([]);
      return;
    }

    setAvailableCredits((prev) => {
      if (prev.length > 0) {
        return prev;
      }
      const credits = Array.from(
        new Set(courses.map((course) => course.credits)),
      ).sort((a, b) => a - b);
      return credits;
    });
  }, [courses, status]);

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

  const handleCourseAdd = async (
    courseCode: string,
    title: string,
    year: number,
    term: string,
  ) => {
    try {
      const id = await createUserCourse({
        courseCode,
        title,
        year,
        term: term as "spring" | "summer" | "fall" | "j-term",
      });
      toast.success(
        `${courseCode} added to ${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`,
        {
          action: {
            label: "Undo",
            onClick: () => deleteUserCourse({ id }),
          },
        },
      );
      setSelectedCourse(null);
    } catch (error) {
      const errorMessage =
        error instanceof ConvexError
          ? (error.data as string)
          : error instanceof Error
            ? error.message
            : "Unexpected error occurred";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="shrink-0">
        <CoursePlanFilters
          searchInput={searchQuery}
          onSearchChange={onSearchChange}
          creditFilter={creditFilter}
          onCreditFilterChange={setCreditFilter}
          availableCredits={availableCredits}
          isExpanded={isFiltersExpanded}
          onToggleExpand={handleToggleFilters}
        />
      </div>

      {filteredCourses.length === 0 && !isSearching && (
        <div className="flex flex-col space-y-4 items-center justify-center flex-1">
          <p className="text-gray-500">No courses found.</p>
          <Button
            variant="outline"
            onClick={() => {
              setCreditFilter(null);
              onSearchChange("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {filteredCourses.length === 0 && isSearching && (
        <div className="flex flex-col space-y-4 items-center justify-center flex-1">
          <p className="text-gray-500">Searching...</p>
        </div>
      )}

      {filteredCourses.length > 0 && (
        <div className="overflow-auto no-scrollbar w-full flex-1 min-h-0 space-y-2">
          {filteredCourses.map((course) => (
            <CoursePlanCard
              key={course._id}
              course={course}
              onAdd={() => setSelectedCourse(course)}
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

      {selectedCourse && (
        <TermYearSelector
          course={selectedCourse}
          student={student}
          onConfirm={handleCourseAdd}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

export default CoursePlanSelector;
