"use client";

import type { api } from "@albert-plus/server/convex/_generated/api";
import clsx from "clsx";
import type { FunctionReturnType } from "convex/server";
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
import type { Term, TermYear } from "@/utils/term";
import {
  buildAcademicTimeline,
  compareTermYear,
  getAcademicYearLabel,
  makeTermKey,
} from "@/utils/term";

interface PlanTableProps {
  courses:
    | FunctionReturnType<typeof api.userCourses.getUserCourses>
    | undefined;
  student:
    | FunctionReturnType<typeof api.students.getCurrentStudent>
    | undefined;
}

type UserCourseEntry = NonNullable<
  FunctionReturnType<typeof api.userCourses.getUserCourses>
>[number];

export default function PlanTable({ courses, student }: PlanTableProps) {
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

  const academicTimeline = useMemo(() => {
    if (!student?.startingDate || !student?.expectedGraduationDate) {
      return null;
    }

    const start: TermYear = {
      term: student.startingDate.term as Term,
      year: student.startingDate.year,
    };

    const expected: TermYear = {
      term: student.expectedGraduationDate.term as Term,
      year: student.expectedGraduationDate.year,
    };

    let end: TermYear = { ...expected };

    const courseTerms: TermYear[] =
      courses?.map((userCourse) => ({
        term: userCourse.term as Term,
        year: userCourse.year,
      })) ?? [];

    for (const courseTerm of courseTerms) {
      if (compareTermYear(courseTerm, end) > 0) {
        end = courseTerm;
      }
    }

    return buildAcademicTimeline(start, end);
  }, [courses, student]);

  const timelineYearIndices = useMemo(() => {
    if (!academicTimeline) {
      return null;
    }
    return new Set(academicTimeline.termToYearIndex.values());
  }, [academicTimeline]);

  const yearColumns = useMemo(() => {
    const yearSet = new Set<number>();
    filteredData?.forEach((userCourse) => {
      const term = userCourse.term as Term;
      const key = makeTermKey(term, userCourse.year);
      const mappedYear =
        academicTimeline?.termToYearIndex.get(key) ?? userCourse.year;
      yearSet.add(mappedYear);
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [academicTimeline, filteredData]);

  const yearTermMap = useMemo(() => {
    const map = new Map<number, Map<Term, UserCourseEntry[]>>();

    filteredData?.forEach((userCourse) => {
      const term = userCourse.term as Term;
      const key = makeTermKey(term, userCourse.year);
      const yearKey =
        academicTimeline?.termToYearIndex.get(key) ?? userCourse.year;

      if (!map.has(yearKey)) {
        map.set(yearKey, new Map());
      }
      const termMap = map.get(yearKey);
      if (!termMap) return;

      if (!termMap.has(term)) {
        termMap.set(term, []);
      }
      termMap.get(term)?.push(userCourse);
    });

    return map;
  }, [academicTimeline, filteredData]);

  // only show terms with course
  const visibleTerms = useMemo(() => {
    return allTerms.filter((term) => {
      return yearColumns.some((year) => {
        const termMap = yearTermMap.get(year);
        const termCourses = termMap?.get(term) ?? [];
        return termCourses.length > 0;
      });
    });
  }, [allTerms, yearColumns, yearTermMap]);

  if (!courses) {
    // TODO: add skeletons for the page
    return null;
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
            {yearColumns.map((year) => {
              const totalCredits = Array.from(
                yearTermMap.get(year)?.values() || [],
              )
                .flat()
                .reduce((sum, c) => sum + (c?.course?.credits || 0), 0);
              const columnLabel = timelineYearIndices?.has(year)
                ? getAcademicYearLabel(year)
                : year.toString();

              return (
                <TableHead
                  key={year}
                  className="border-t min-w-[200px] w-[200px] "
                >
                  <div className="px-2 flex flex-row justify-between">
                    <div className="font-semibold">{columnLabel}</div>
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
                {yearColumns.map((year) => {
                  const termMap = yearTermMap.get(year);
                  const userCourses = termMap?.get(term) ?? [];
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
