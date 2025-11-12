"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import PlanTable from "./components/plan-table";

const PlanPage = () => {
  const { isAuthenticated } = useConvexAuth();

  const courses = useQuery(
    api.userCourses.getUserCourses,
    isAuthenticated ? {} : "skip",
  );
  const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

  return <PlanTable courses={courses} student={student} />;
};

export default PlanPage;
