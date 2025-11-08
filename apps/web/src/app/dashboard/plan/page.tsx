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

  return <PlanTable courses={courses} />;
};

export default PlanPage;
