"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { FileTextIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurrentTerm, useCurrentYear } from "@/components/AppConfigProvider";
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
import { cn } from "@/lib/utils";
import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import type { UserCourse } from "@/modules/report-parsing/types";
import type { StartingTerm } from "@/modules/report-parsing/utils/parse-starting-term";
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

  const currentTerm = useCurrentTerm();
  const currentYear = useCurrentYear();

  const [courseSearch, setCourseSearch] = useState<string>("");

  const importUserCourses = useMutation(api.userCourses.importUserCourses);

  const updateStudent = useMutation(api.students.updateCurrentStudent);

  const courseSearchId = useId();

  const handleImportConfirm = async (
    coursesToImport: UserCourse[],
    startingTerm: StartingTerm | null,
  ) => {
    if (coursesToImport.length === 0) {
      return;
    }

    if (startingTerm) {
      await updateStudent({ startingDate: startingTerm });
    }

    const result = await importUserCourses({
      courses: coursesToImport,
    });

    const messages: string[] = [];
    if (result) {
      if (result.inserted > 0) {
        messages.push(
          `${result.inserted} new course${result.inserted !== 1 ? "s" : ""} imported`,
        );
      }
      if (result.updated > 0) {
        messages.push(
          `${result.updated} course${result.updated !== 1 ? "s" : ""} updated with grades`,
        );
      }
      if (result.duplicates > 0) {
        messages.push(
          `${result.duplicates} duplicate${result.duplicates !== 1 ? "s" : ""} skipped`,
        );
      }
    }

    const successMessage =
      messages.length > 0
        ? `Import complete: ${messages.join(", ")}`
        : "Import complete";

    toast.success(successMessage);
  };

  // Filter courses based on search
  const filteredData = useMemo(() => {
    return courses?.filter((userCourse) => {
      const matchesSearch =
        !courseSearch ||
        (userCourse.course
          ? userCourse.course.code
              .toLowerCase()
              .includes(courseSearch.toLowerCase())
          : false) ||
        userCourse.title.toLowerCase().includes(courseSearch.toLowerCase());
      return matchesSearch;
    });
  }, [courses, courseSearch]);

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

  const currentColumnKey = useMemo(() => {
    if (!currentTerm || !currentYear) {
      return null;
    }

    const key = makeTermKey(currentTerm, currentYear);
    const mapped = academicTimeline?.termToYearIndex.get(key);

    if (mapped !== undefined) {
      return mapped;
    }

    return currentYear;
  }, [academicTimeline, currentTerm, currentYear]);

  const yearColumns = useMemo(() => {
    if (timelineYearIndices && timelineYearIndices.size > 0) {
      return Array.from(timelineYearIndices).sort((a, b) => a - b);
    }

    // Fallback: if no timeline, show years that have courses
    const yearSet = new Set<number>();
    filteredData?.forEach((userCourse) => {
      const term = userCourse.term as Term;
      const key = makeTermKey(term, userCourse.year);
      const mappedYear =
        academicTimeline?.termToYearIndex.get(key) ?? userCourse.year;
      yearSet.add(mappedYear);
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [academicTimeline, filteredData, timelineYearIndices]);

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

  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-8 text-center max-w-xl w-full px-4">
          <div className="space-y-4">
            <div
              className="flex size-20 mx-auto items-center justify-center rounded-full border-2 bg-gradient-to-br from-muted to-muted/50 shadow-sm"
              aria-hidden="true"
            >
              <FileTextIcon className="size-10 opacity-70" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">
                No courses found
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Upload your Degree Progress Report to import your course history
                and start planning your academic journey.
              </p>
            </div>
          </div>
          <div className="w-full max-w-md">
            <DegreeProgreeUpload onConfirm={handleImportConfirm} />
          </div>
        </div>
      </div>
    );
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
                  className={"border-t min-w-[200px] w-[200px]"}
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
                  const isCurrentColumn = currentColumnKey === year;
                  return (
                    <TableCell
                      key={year}
                      className={cn(
                        "align-top p-3",
                        isCurrentColumn && "bg-primary/5",
                      )}
                    >
                      {userCourses.length > 0 ? (
                        <div className="space-y-3">
                          {userCourses.map((userCourse) => {
                            const key = userCourse.course
                              ? `${year}-${term}-${userCourse.course.code}`
                              : `${year}-${term}-${userCourse._id}`;

                            if (!userCourse.course) {
                              return (
                                <div
                                  key={key}
                                  className="block p-2 border border-dashed border-amber-500/50 rounded-md bg-amber-500/5"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-amber-900 dark:text-amber-300">
                                      {userCourse.title}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {userCourse.courseCode}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <Link
                                key={key}
                                href={userCourse.course.courseUrl}
                                target="_blank"
                                className={
                                  "block p-2 border rounded-md bg-card hover:bg-muted/50 transition-colors"
                                }
                              >
                                <div className="font-medium text-sm">
                                  {userCourse.title}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {userCourse.course.code}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
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
