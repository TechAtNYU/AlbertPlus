"use client";

import type { api } from "@albert-plus/server/convex/_generated/api";
import clsx from "clsx";
import type { FunctionReturnType } from "convex/server";
import _ from "lodash";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlanTableProps {
  courses:
    | FunctionReturnType<typeof api.userCourses.getUserCourses>
    | undefined;
}

export default function PlanTable({ courses }: PlanTableProps) {
  const allTerms = ["fall", "j-term", "spring", "summer"] as const;

  const [courseSearch, setCourseSearch] = useState<string>("");
  const [creditFilter, setCreditFilter] = useState<number | null>(null);

  const courseSearchId = useId();

  // Get unique credit values from all courses
  // used by the credits filter
  const availableCredits = useMemo(() => {
    const credits = new Set<number>();
    courses?.forEach((userCourse) => {
      if (userCourse.course) {
        credits.add(userCourse.course.credits);
      }
    });
    return Array.from(credits).sort((a, b) => a - b);
  }, [courses]);

  // Filter courses based on all filters
  const filteredData = useMemo(() => {
    return courses?.filter((userCourse) => {
      if (!userCourse.course) return false;

      const matchesSearch =
        !courseSearch ||
        userCourse.course.code
          .toLowerCase()
          .includes(courseSearch.toLowerCase()) ||
        userCourse.title.toLowerCase().includes(courseSearch.toLowerCase());
      const matchesCredits =
        creditFilter === null || userCourse.course.credits === creditFilter;
      return matchesSearch && matchesCredits;
    });
  }, [courses, courseSearch, creditFilter]);

  // Get unique years from the filtered data
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    filteredData?.forEach((userCourse) => {
      yearSet.add(userCourse.year);
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [filteredData]);

  // Create a map of year -> term -> courses using filtered courses
  const yearTermMap = useMemo(() => {
    const map = new Map<
      number,
      Map<(typeof allTerms)[number], typeof filteredData>
    >();

    filteredData?.forEach((userCourse) => {
      if (!map.has(userCourse.year)) {
        map.set(userCourse.year, new Map());
      }
      const termMap = map.get(userCourse.year);
      if (!termMap) return;

      if (!termMap.has(userCourse.term)) {
        termMap.set(userCourse.term, []);
      }
      const termCourses = termMap.get(userCourse.term);
      if (termCourses) {
        termCourses.push(userCourse);
      }
    });

    return map;
  }, [filteredData]);

  // only show terms with course
  const visibleTerms = useMemo(() => {
    return allTerms.filter((term) => {
      return years.some((year) => {
        const termMap = yearTermMap.get(year);
        const courses = termMap?.get(term) || [];
        return courses.length > 0;
      });
    });
  }, [allTerms, years, yearTermMap]);

  if (!courses) {
    // TODO add skeletons for the page
    return <></>;
  }

  return (
    <div className="space-y-3 overflow-x-auto">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Course search */}
        <div className="w-64 flex flex-col space-y-1">
          <Label htmlFor={courseSearchId}>Search</Label>
          <div className="relative">
            <Input
              id={courseSearchId}
              className="peer ps-9"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search by code or title"
              type="text"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <SearchIcon size={16} />
            </div>
          </div>
        </div>

        {/* Credits filter */}
        <div className="flex flex-col space-y-1">
          <Label>Credits</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreditFilter(null)}
              className={clsx(
                "px-3 py-2 text-sm font-medium border rounded-lg transition-colors",
                creditFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted",
              )}
            >
              All
            </button>
            {availableCredits.map((credit) => (
              <button
                type="button"
                key={credit}
                onClick={() => setCreditFilter(credit)}
                className={clsx(
                  "px-3 py-2 text-sm font-medium border rounded-lg transition-colors",
                  creditFilter === credit
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted",
                )}
              >
                {credit}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Table className="min-w-max">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="border-t w-[80px]">
              <div className="font-semibold">Term</div>
            </TableHead>
            {years.map((year) => {
              const totalCredits = _.sumBy(
                _.flatten(Array.from(yearTermMap.get(year)?.values() || [])),
                (c) => c?.course?.credits || 0,
              );

              return (
                <TableHead
                  key={year}
                  className="border-t min-w-[200px] w-[200px] "
                >
                  <div className="px-2 flex flex-row justify-between">
                    <div className="font-semibold">{year}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {totalCredits} credits
                    </div>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleTerms.map((term) => {
            return (
              <TableRow key={term}>
                <TableCell className="font-medium bg-muted/30 capitalize">
                  {term}
                </TableCell>
                {years.map((year) => {
                  const termMap = yearTermMap.get(year);
                  const userCourses = termMap?.get(term) || [];
                  return (
                    <TableCell key={year} className="align-top p-3">
                      {userCourses.length > 0 ? (
                        <div className="space-y-3">
                          {userCourses.map((userCourse) => {
                            if (!userCourse.course) return null;

                            const key = `${year}-${term}-${userCourse.course.code}`;
                            return (
                              <Link
                                key={key}
                                href={userCourse.course.courseUrl}
                                target="_blank"
                                className="block p-2 border rounded-md bg-card hover:bg-muted/50 transition-colors"
                              >
                                <div className="font-medium text-sm">
                                  {userCourse.course.code}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {userCourse.title}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No courses
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
