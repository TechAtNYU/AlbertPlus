import { useCallback, useState } from "react";

export const useCourseExpansion = () => {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(),
  );

  const toggleCourseExpansion = useCallback((courseCode: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseCode)) {
        newSet.delete(courseCode);
      } else {
        newSet.add(courseCode);
      }
      return newSet;
    });
  }, []);

  const isExpanded = useCallback(
    (courseCode: string) => expandedCourses.has(courseCode),
    [expandedCourses],
  );

  return {
    expandedCourses,
    toggleCourseExpansion,
    isExpanded,
  };
};
