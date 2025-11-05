import { useMemo, useReducer } from "react";
import { DEFAULT_SELECTED_DAYS } from "../components/DaysOfWeek";
import type {
  CourseOfferingWithCourse,
  CourseWithOfferings,
  FilterAction,
  FilterState,
} from "../types";

const initialFilterState: FilterState = {
  creditFilter: null,
  selectedDays: DEFAULT_SELECTED_DAYS,
};

const filterReducer = (
  state: FilterState,
  action: FilterAction,
): FilterState => {
  switch (action.type) {
    case "SET_CREDIT":
      return { ...state, creditFilter: action.payload };
    case "SET_DAYS":
      return { ...state, selectedDays: action.payload };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
};

export const useCourseFiltering = (
  courseOfferingsWithCourses: CourseOfferingWithCourse[],
) => {
  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
  const { creditFilter, selectedDays } = filterState;

  // Group course offerings by course code
  const coursesWithOfferings: CourseWithOfferings[] = useMemo(() => {
    const offeringsByCode = courseOfferingsWithCourses.reduce(
      (acc, offering) => {
        const key = offering.courseCode;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(offering);
        return acc;
      },
      {} as Record<string, CourseOfferingWithCourse[]>,
    );

    const uniqueCourses = new Map<string, CourseOfferingWithCourse["course"]>();
    courseOfferingsWithCourses.forEach((offering) => {
      if (offering.course && !uniqueCourses.has(offering.courseCode)) {
        uniqueCourses.set(offering.courseCode, offering.course);
      }
    });

    return Array.from(uniqueCourses.entries())
      .filter(
        (
          entry,
        ): entry is [string, NonNullable<CourseOfferingWithCourse["course"]>] =>
          entry[1] !== null && entry[1] !== undefined,
      )
      .map(([code, course]) => ({
        ...course,
        offerings: offeringsByCode[code] || [],
      }));
  }, [courseOfferingsWithCourses]);

  // Get unique credits for filter buttons
  const availableCredits = useMemo(() => {
    const credits = new Set(
      coursesWithOfferings
        .map((course) => course.credits)
        .filter((credit) => credit !== undefined),
    );
    return Array.from(credits).sort((a, b) => a - b);
  }, [coursesWithOfferings]);

  const filteredData: CourseWithOfferings[] = useMemo(() => {
    let filtered = coursesWithOfferings;

    if (creditFilter !== null) {
      filtered = filtered.filter((course) => course.credits === creditFilter);
    }

    const selectedDaySet = new Set(
      selectedDays.map((day) => day.toLowerCase()),
    );

    if (selectedDaySet.size === 0) {
      return [];
    }

    filtered = filtered
      .map((course) => {
        const offerings = course.offerings.filter((offering) =>
          offering.days.some((day: string) =>
            selectedDaySet.has(day.toLowerCase()),
          ),
        );

        return {
          ...course,
          offerings,
        };
      })
      .filter((course) => course.offerings.length > 0);

    return filtered;
  }, [coursesWithOfferings, creditFilter, selectedDays]);

  return {
    filterState,
    dispatch,
    filteredData,
    availableCredits,
  };
};
