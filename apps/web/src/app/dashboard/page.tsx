"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import {
  type RequestForQueries,
  useConvexAuth,
  useQueries,
  useQuery,
} from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ProgramRequirementsChart } from "@/app/dashboard/components/degree-charts";

const HomePage = () => {
  const { isAuthenticated } = useConvexAuth();
  const student = useQuery(
    api.students.getCurrentStudent,
    !isAuthenticated ? "skip" : {},
  );

  const userCourses = useQuery(
    api.userCourses.getUserCourses,
    !isAuthenticated ? "skip" : {},
  );

  const programQueries: RequestForQueries = {};

  if (isAuthenticated && student) {
    for (const program of student.programs) {
      programQueries[program._id] = {
        query: api.programs.getProgramById,
        args: { id: program._id },
      };
    }
  }

  const programs: Record<
    string,
    FunctionReturnType<typeof api.programs.getProgramById>
  > = useQueries(programQueries);

  // Collect all unique course codes from all programs of type required/alternative
  const allCourseCodes = new Set<string>();
  for (const [_, programData] of Object.entries(programs)) {
    if (programData?.requirements) {
      for (const requirement of programData.requirements) {
        if (
          requirement.type === "required" ||
          requirement.type === "alternative"
        ) {
          for (const courseCode of requirement.courses) {
            allCourseCodes.add(courseCode);
          }
        }
      }
    }
  }

  // Fetch all courses of type required/alternative
  const courseQueries: RequestForQueries = {};
  for (const code of allCourseCodes) {
    courseQueries[code] = {
      query: api.courses.getCourseByCode,
      args: { code },
    };
  }

  const courses = useQueries(courseQueries);

  const isProgramsLoading =
    !isAuthenticated ||
    student === undefined ||
    Object.keys(programs).length === 0 ||
    Object.values(programs).some((p) => p === undefined);

  return (
    <ProgramRequirementsChart
      programs={programs}
      userCourses={userCourses}
      courses={courses}
      isLoading={isProgramsLoading}
    />
  );
};

export default HomePage;
