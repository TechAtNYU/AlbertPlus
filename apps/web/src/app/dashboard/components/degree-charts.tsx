"use client";

import type { api } from "@albert-plus/server/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface ProgramRequirementsChartProps {
  programs: Record<
    string,
    FunctionReturnType<typeof api.programs.getProgramById> | undefined
  >;
  userCourses:
    | FunctionReturnType<typeof api.userCourses.getUserCourses>
    | undefined;
  courses: Record<
    string,
    FunctionReturnType<typeof api.courses.getCourseByCode> | undefined
  >;
  isLoading: boolean;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

// Helper function to lighten a color (for uncompleted credits)
const lightenColor = (color: string, percent: number = 40): string => {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.min(
    255,
    ((num >> 16) & 0xff) +
      Math.floor((255 - ((num >> 16) & 0xff)) * (percent / 100)),
  );
  const g = Math.min(
    255,
    ((num >> 8) & 0xff) +
      Math.floor((255 - ((num >> 8) & 0xff)) * (percent / 100)),
  );
  const b = Math.min(
    255,
    (num & 0xff) + Math.floor((255 - (num & 0xff)) * (percent / 100)),
  );
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const getRequirementsByCategory = (
  programs: Record<
    string,
    FunctionReturnType<typeof api.programs.getProgramById> | undefined
  >,
  courseLookup: Map<
    string,
    FunctionReturnType<typeof api.courses.getCourseByCode>
  >,
) => {
  if (!programs) return null;

  // Get the first defined program
  const program = Object.values(programs).find((p) => p !== undefined);
  if (!program) return null;

  // Calculate total credits for each category
  const groupedRequirements: Record<
    string,
    { credits: number; courses: string[][] }
  > = {};

  // FIXME: currently no merging of programs if more than one listed (dual degree), assumes only one program for now
  const requirements = program.requirements;
  if (!requirements) return null;

  for (const requirement of requirements) {
    const courses = requirement.courses;

    // CASE: requirements is type option
    if (requirement.type === "options") {
      const uniquePrefixes = [
        ...new Set(requirement.courses.map((c: string) => c.split(" ")[0])),
      ];

      if (uniquePrefixes.length === 1) {
        // All same prefix - assign all credits to that one prefix
        const prefix = uniquePrefixes[0];
        if (!groupedRequirements[prefix]) {
          groupedRequirements[prefix] = { credits: 0, courses: [] };
        }
        groupedRequirements[prefix].credits += requirement.creditsRequired;
        groupedRequirements[prefix].courses.push(courses);
      } else {
        // Mixed prefixes - assign to "Other" category
        if (!groupedRequirements.Other) {
          groupedRequirements.Other = { credits: 0, courses: [] };
        }
        groupedRequirements.Other.credits += requirement.creditsRequired;
        groupedRequirements.Other.courses.push(courses);
      }
    }
    // CASE: Required/Alternative type - calculate actual credits per course
    else {
      for (const courseCode of courses) {
        const prefix = courseCode.split(" ")[0];
        const course = courseLookup.get(courseCode);
        const credits = course?.credits ?? 4; // fallback to 4 credits if not found

        if (!groupedRequirements[prefix]) {
          groupedRequirements[prefix] = { credits: 0, courses: [] };
        }
        groupedRequirements[prefix].credits += credits;
        groupedRequirements[prefix].courses.push([courseCode]);
      }
    }
  }

  return {
    ...program,
    requirementsByCategory: groupedRequirements,
  };
};

export function ProgramRequirementsChart({
  programs,
  userCourses,
  courses,
  isLoading,
}: ProgramRequirementsChartProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Create a lookup map from courses Record
  const courseLookup = useMemo(() => {
    const lookup = new Map<
      string,
      FunctionReturnType<typeof api.courses.getCourseByCode>
    >();
    for (const [code, courseData] of Object.entries(courses)) {
      if (courseData !== undefined) {
        lookup.set(code, courseData);
      }
    }
    return lookup;
  }, [courses]);

  // Get grouped requirements using the lookup
  const program = useMemo(
    () => getRequirementsByCategory(programs, courseLookup),
    [programs, courseLookup],
  );

  const { chartData, totalCredits, totalCompletedCredits, overallPercentage } =
    useMemo(() => {
      if (!program || program === null) {
        return {
          chartData: [],
          totalCredits: 0,
          totalCompletedCredits: 0,
          overallPercentage: 0,
        };
      }

      const completedCreditsByCategory: Record<string, number> = {};
      if (userCourses) {
        for (const userCourse of userCourses) {
          for (const [prefix, data] of Object.entries(
            program.requirementsByCategory,
          )) {
            // Check if the course code is in any of the nested course arrays
            const isInRequirement = data.courses.some((courseGroup) =>
              courseGroup.some(
                (course) =>
                  course.toLowerCase() === userCourse.courseCode.toLowerCase(),
              ),
            );

            if (isInRequirement) {
              completedCreditsByCategory[prefix] =
                (completedCreditsByCategory[prefix] || 0) +
                (userCourse.course?.credits || 0);
              break;
            }
          }
        }
      }

      // Transform the data for the chart
      const data = Object.entries(program.requirementsByCategory)
        .map(([prefix, data]) => {
          const completed = completedCreditsByCategory[prefix] || 0;
          const percentage =
            data.credits > 0 ? Math.round((completed / data.credits) * 100) : 0;
          return {
            category: prefix,
            credits: data.credits,
            completedCredits: completed,
            remainingCredits: data.credits - completed,
            percentage,
          };
        })
        .sort((a, b) => {
          // "Other" should always be at the bottom
          if (a.category === "Other") return 1;
          if (b.category === "Other") return -1;
          // Otherwise, maintain alphabetical order
          return a.category.localeCompare(b.category);
        });

      // Calculate totals
      const totalCredits = data.reduce((sum, item) => sum + item.credits, 0);
      const totalCompletedCredits = data.reduce(
        (sum, item) => sum + item.completedCredits,
        0,
      );
      const overallPercentage =
        totalCredits > 0
          ? Math.round((totalCompletedCredits / totalCredits) * 100)
          : 0;

      return {
        chartData: data,
        totalCredits,
        totalCompletedCredits,
        overallPercentage,
      };
    }, [program, userCourses]);

  // Prepare pie chart data based on toggle state
  const pieChartData = useMemo(() => {
    if (chartData.length === 0) return [];

    if (!showCompletion) {
      // Default view: just total credits per category
      return chartData.map((item, index) => ({
        name: item.category,
        value: item.credits,
        fill: COLORS[index % COLORS.length],
      }));
    } else {
      // Completion view: split each category into completed and remaining
      const splitData: Array<{
        name: string;
        value: number;
        fill: string;
        isCompleted: boolean;
        category: string;
      }> = [];

      chartData.forEach((item, index) => {
        const baseColor = COLORS[index % COLORS.length];

        // Add completed portion (darker - original color)
        if (item.completedCredits > 0) {
          splitData.push({
            name: `${item.category} (Completed)`,
            value: item.completedCredits,
            fill: baseColor,
            isCompleted: true,
            category: item.category,
          });
        }

        // Add remaining portion (lighter shade)
        if (item.remainingCredits > 0) {
          splitData.push({
            name: `${item.category} (Remaining)`,
            value: item.remainingCredits,
            fill: lightenColor(baseColor),
            isCompleted: false,
            category: item.category,
          });
        }
      });

      return splitData;
    }
  }, [chartData, showCompletion]);

  // Mark as animated after first data load
  useEffect(() => {
    if (pieChartData.length > 0 && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [pieChartData, hasAnimated]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Program Requirements</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (program === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Program Requirements</CardTitle>
          <CardDescription>Program not found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Program Requirements by Subject</CardTitle>
            <CardDescription>
              {program.name} - Total: {totalCredits} credits
              <span className="ml-2 font-semibold text-foreground">
                • {overallPercentage}% Complete ({totalCompletedCredits}/
                {totalCredits} credits)
              </span>
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="show-completion"
            checked={showCompletion}
            onCheckedChange={(checked) => setShowCompletion(checked === true)}
          />
          <Label
            htmlFor="show-completion"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show completion progress
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center relative">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={130}
                isAnimationActive={!hasAnimated}
              >
                {pieChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                dy="-15"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground font-bold"
                style={{ fontSize: "36px" }}
              >
                {showCompletion
                  ? `${totalCompletedCredits}/${totalCredits}`
                  : totalCredits}
              </text>
              <text
                x="50%"
                y="50%"
                dy="25"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                style={{ fontSize: "20px" }}
              >
                credits
              </text>
              <Tooltip
                animationDuration={0}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as {
                      name: string;
                      value: number;
                      fill: string;
                    };
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold">{data.name}</span>
                          <span className="text-sm text-muted-foreground">
                            Credits: {data.value}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
