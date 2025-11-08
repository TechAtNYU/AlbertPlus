"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useMutation } from "convex/react";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import type { UserCourse } from "@/modules/report-parsing/types";
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
import { toast } from "sonner";

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
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const importUserCourses = useMutation(api.userCourses.importUserCourses);

  const courseSearchId = useId();

  const handleImportConfirm = async (coursesToImport: UserCourse[]) => {
    if (coursesToImport.length === 0) {
      setIsUploadOpen(false);
      return { inserted: 0, updated: 0, duplicates: 0 };
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
      setIsUploadOpen(false);
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
      if (!userCourse.course) return false;

      const matchesSearch =
        !courseSearch ||
        userCourse.course.code
          .toLowerCase()
          .includes(courseSearch.toLowerCase()) ||
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
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="self-end" variant="outline">
              Import from report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import from Degree Progress Report</DialogTitle>
              <DialogDescription>
                Upload your report PDF to import courses.
              </DialogDescription>
            </DialogHeader>
            <DegreeProgreeUpload onConfirm={handleImportConfirm} />
          </DialogContent>
        </Dialog>
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
