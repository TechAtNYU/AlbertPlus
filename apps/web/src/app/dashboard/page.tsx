"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import {
  type RequestForQueries,
  useConvexAuth,
  useQueries,
  useQuery,
} from "convex/react";
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
    for (const programId of student.programs) {
      programQueries[programId] = {
        query: api.programs.getProgramById,
        args: { id: programId },
      };
    }
  }

  const programs = useQueries(programQueries);

  // Collect all unique course codes from all programs
  const allCourseCodes = new Set<string>();
  for (const [_, programData] of Object.entries(programs)) {
    if (programData?.requirements) {
      for (const requirement of programData.requirements) {
        for (const courseCode of requirement.courses) {
          allCourseCodes.add(courseCode);
        }
      }
    }
  }

  // Fetch all courses
  const courseQueries: RequestForQueries = {};
  for (const code of allCourseCodes) {
    courseQueries[code] = {
      query: api.courses.getCourseByCode,
      args: { code },
    };
  }

  const courses = useQueries(courseQueries);

  return (
    <ProgramRequirementsChart
      programs={programs}
      userCourses={userCourses}
      courses={courses}
    />
  );
};

export default HomePage;
