import type { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import type { DayOptionValue } from "./components/DaysOfWeek";

export type Course = Doc<"courses">;
export type CourseOffering = Doc<"courseOfferings">;

export interface CourseWithOfferings extends Course {
  offerings: CourseOffering[];
}
export type CourseOfferingWithCourse = FunctionReturnType<
  typeof api.courseOfferings.getCourseOfferings
>["page"][number];

export interface FilterState {
  creditFilter: number | null;
  selectedDays: DayOptionValue[];
}

export type FilterAction =
  | { type: "SET_CREDIT"; payload: number | null }
  | { type: "SET_DAYS"; payload: DayOptionValue[] }
  | { type: "RESET_FILTERS" };
