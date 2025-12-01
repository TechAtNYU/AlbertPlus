"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { ConvexError } from "convex/values";
import { ListIcon, TableIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ViewSelector from "@/components/ViewSelector";
import { useSearchParam } from "@/hooks/use-search-param";
import { CoursePlanSelector } from "@/modules/course-plan-selector";
import PlanTable from "./components/plan-table";

const PlanPage = () => {
  const { isAuthenticated } = useConvexAuth();

  const [mobileView, setMobileView] = useState<"selector" | "table">("table");
  const [_isMobile, setIsMobile] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const draggableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAddCourseModal) {
        setShowAddCourseModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showAddCourseModal]);

  useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);

    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("dragend", handleDragEnd);

    return () => {
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  const { searchValue, setSearchValue, debouncedSearchValue } = useSearchParam({
    paramKey: "q",
  });

  const [displayedResults, setDisplayedResults] = useState<Doc<"courses">[]>(
    [],
  );
  const prevSearchRef = useRef(debouncedSearchValue);

  const userCourses = useQuery(
    api.userCourses.getUserCourses,
    isAuthenticated ? {} : "skip",
  );
  const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

  const createUserCourse = useMutation(api.userCourses.createUserCourse);
  const deleteUserCourse = useMutation(api.userCourses.deleteUserCourse);

  const { results, status, loadMore } = usePaginatedQuery(
    api.courses.getCourses,
    isAuthenticated
      ? {
          level: "undergraduate", // TODO: make it configurable
          query: debouncedSearchValue || undefined,
        }
      : "skip",
    { initialNumItems: 100 },
  );

  useEffect(() => {
    if (status !== "LoadingFirstPage") {
      setDisplayedResults(results);
      prevSearchRef.current = debouncedSearchValue;
    }
  }, [results, debouncedSearchValue, status]);

  const isSearching =
    status === "LoadingFirstPage" &&
    prevSearchRef.current !== debouncedSearchValue &&
    prevSearchRef.current !== "";

  const handleMobileViewChange = (view: "selector" | "table") => {
    setMobileView(view);
  };

  const handleCourseDrop = async (
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
      toast.success(`${courseCode} added to ${term} ${year}`, {
        action: {
          label: "Undo",
          onClick: () => deleteUserCourse({ id }),
        },
      });
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
    <div className="flex flex-col gap-4 h-[calc(100vh-(--spacing(16))-(--spacing(12)))] w-full">
      {/* Mobile toggle buttons */}
      <div className="md:hidden shrink-0 p-2">
        <ViewSelector
          value={mobileView}
          onValueChange={handleMobileViewChange}
          tabs={[
            { value: "selector", label: "Search", icon: ListIcon },
            { value: "table", label: "Plan", icon: TableIcon },
          ]}
        />
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex-1 min-h-0">
        {mobileView === "selector" ? (
          <CoursePlanSelector
            courses={displayedResults}
            student={student}
            onSearchChange={setSearchValue}
            searchQuery={searchValue}
            loadMore={loadMore}
            status={status}
            isSearching={isSearching}
          />
        ) : (
          <div className="h-full overflow-auto">
            <PlanTable
              courses={userCourses}
              student={student}
              isDragging={isDragging}
              onCourseDrop={handleCourseDrop}
            />
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block flex-1 min-h-0 relative">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <PlanTable
              courses={userCourses}
              student={student}
              isDragging={isDragging}
              onCourseDrop={handleCourseDrop}
              onAddExternalCourse={() => {
                setShowAddCourseModal(true);
              }}
            />
          </div>
        </div>

        {showAddCourseModal && (
          <Draggable nodeRef={draggableRef} handle=".drag-handle" bounds="body">
            <div
              ref={draggableRef}
              className="fixed top-0 left-0 z-50 w-[390px] bg-background border rounded-lg shadow-lg"
            >
              <div className="drag-handle flex items-center justify-between p-3 border-b cursor-move">
                <h2 className="text-sm font-semibold">Add From Albert</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCourseModal(false)}
                  className="h-6 w-6 p-0"
                >
                  <span className="sr-only">Close</span>✕
                </Button>
              </div>
              <div className="h-[70vh] overflow-hidden">
                <div className="h-full px-4 py-3">
                  <CoursePlanSelector
                    courses={displayedResults}
                    student={student}
                    onSearchChange={setSearchValue}
                    searchQuery={searchValue}
                    loadMore={loadMore}
                    status={status}
                    isSearching={isSearching}
                  />
                </div>
              </div>
            </div>
          </Draggable>
        )}
      </div>
    </div>
  );
};

export default PlanPage;
