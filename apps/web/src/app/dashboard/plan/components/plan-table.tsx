"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  FileTextIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurrentTerm, useCurrentYear } from "@/components/AppConfigProvider";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
  isDragging?: boolean;
  onCourseDrop?: (
    courseCode: string,
    title: string,
    year: number,
    term: string,
  ) => void;
  onAddExternalCourse?: () => void;
}

type UserCourseEntry = NonNullable<
  FunctionReturnType<typeof api.userCourses.getUserCourses>
>[number];

export default function PlanTable({
  courses,
  student,
  isDragging = false,
  onCourseDrop,
  onAddExternalCourse,
}: PlanTableProps) {
  const allTerms = ["fall", "j-term", "spring", "summer"] as const;

  const currentTerm = useCurrentTerm();
  const currentYear = useCurrentYear();

  const [courseSearch, setCourseSearch] = useState<string>("");
  const [dragOverCell, setDragOverCell] = useState<{
    year: number;
    term: Term;
  } | null>(null);

  const importUserCourses = useMutation(api.userCourses.importUserCourses);
  const createUserCourse = useMutation(api.userCourses.createUserCourse);
  const deleteUserCourse = useMutation(api.userCourses.deleteUserCourse);
  const updateUserCourse = useMutation(api.userCourses.updateUserCourse);

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

  const handleDeleteCourse = async (userCourse: UserCourseEntry) => {
    try {
      await deleteUserCourse({ id: userCourse._id });
      toast.success(`${userCourse.courseCode} removed`, {
        action: {
          label: "Undo",
          onClick: async () => {
            await createUserCourse({
              courseCode: userCourse.courseCode,
              title: userCourse.title,
              year: userCourse.year,
              term: userCourse.term,
              ...(userCourse.grade && { grade: userCourse.grade }),
            });
          },
        },
      });
    } catch (_error) {
      toast.error("Failed to delete course");
    }
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

  const yearIndexToActualYear = useMemo(() => {
    const map = new Map<string, number>();

    if (academicTimeline?.termToYearIndex) {
      academicTimeline.termToYearIndex.forEach((yearIndex, termKey) => {
        const actualYear = parseInt(termKey.split("-")[1], 10);
        const term = termKey.split("-")[0];
        const reverseKey = `${yearIndex}-${term}`;
        map.set(reverseKey, actualYear);
      });
    }

    return map;
  }, [academicTimeline]);

  const setDragPayload = (
    e: React.DragEvent<HTMLElement>,
    payload: Record<string, unknown>,
  ) => {
    const serialized = JSON.stringify(payload);
    e.dataTransfer.setData("application/json", serialized);
    e.dataTransfer.setData("text/plain", serialized);
  };

  const handleInternalDragStart = (
    e: React.DragEvent<HTMLElement>,
    userCourse: UserCourseEntry,
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-albert-internal", "true");
    setDragPayload(e, {
      userCourseId: userCourse._id,
      courseCode: userCourse.course?.code ?? userCourse.courseCode,
      title: userCourse.title,
      term: userCourse.term,
      year: userCourse.year,
    });
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.6";
    }
  };

  const handleInternalDragEnd = (e: React.DragEvent<HTMLElement>) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

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
    return <Loader2Icon className="animate-spin" />;
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
      <div className="flex flex-wrap gap-3 items-end">
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
        <Button className="hidden md:block w-fit" onClick={onAddExternalCourse}>
          Add From Albert
        </Button>
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
                  const isDragOver =
                    dragOverCell?.year === year && dragOverCell?.term === term;

                  const handleDragOver = (
                    e: React.DragEvent<HTMLTableCellElement>,
                  ) => {
                    e.preventDefault();
                    const isInternal = e.dataTransfer.types.includes(
                      "application/x-albert-internal",
                    );
                    e.dataTransfer.dropEffect = isInternal ? "move" : "copy";
                    if (
                      !dragOverCell ||
                      dragOverCell.year !== year ||
                      dragOverCell.term !== term
                    ) {
                      setDragOverCell({ year, term });
                    }
                  };

                  const handleDragLeave = (
                    e: React.DragEvent<HTMLTableCellElement>,
                  ) => {
                    // Only clear if leaving the cell itself, not child elements
                    if (e.currentTarget === e.target) {
                      setDragOverCell(null);
                    }
                  };

                  const handleDrop = (
                    e: React.DragEvent<HTMLTableCellElement>,
                  ) => {
                    e.preventDefault();
                    setDragOverCell(null);

                    let data: {
                      userCourseId?: string;
                      courseCode?: string;
                      title?: string;
                      term?: string;
                      year?: number;
                    };

                    try {
                      const rawData =
                        e.dataTransfer.getData("application/json") ||
                        e.dataTransfer.getData("text/plain");
                      if (!rawData) {
                        e.dataTransfer.dropEffect = "none";
                        return;
                      }
                      data = JSON.parse(rawData);
                    } catch (error) {
                      console.error("Error parsing dropped data:", error);
                      return;
                    }

                    const isInternalDrag = Boolean(data?.userCourseId);
                    e.dataTransfer.dropEffect = isInternalDrag
                      ? "move"
                      : "copy";

                    const reverseKey = `${year}-${term}`;
                    const actualYear =
                      yearIndexToActualYear.get(reverseKey) ?? year;

                    if (data?.userCourseId) {
                      if (
                        data.term === term &&
                        data.year &&
                        data.year === actualYear
                      ) {
                        return;
                      }

                      updateUserCourse({
                        id: data.userCourseId as Id<"userCourses">,
                        term,
                        year: actualYear,
                      })
                        .then(() => {
                          toast.success(
                            `${data.courseCode ?? "Course"} moved to ${term.charAt(0).toUpperCase() + term.slice(1)} ${actualYear}`,
                          );
                        })
                        .catch(() => {
                          toast.error("Failed to move course");
                        });
                      return;
                    }

                    if (data?.courseCode && data?.title && onCourseDrop) {
                      onCourseDrop(
                        data.courseCode,
                        data.title,
                        actualYear,
                        term,
                      );
                    }
                  };

                  return (
                    <TableCell
                      key={year}
                      className={cn(
                        "align-top p-3 relative transition-all",
                        isCurrentColumn && "bg-primary/5",
                        isDragging && "cursor-copy",
                        isDragOver &&
                          "bg-primary/20 ring-2 ring-primary ring-inset",
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {isDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[2px] pointer-events-none z-10 border-2 border-dashed border-primary rounded">
                          <div className="text-md font-medium text-primary px-3 py-1.5 rounded-md shadow-sm">
                            Drop here to add
                          </div>
                        </div>
                      )}
                      {userCourses.length > 0 ? (
                        <div className="space-y-3">
                          {userCourses.map((userCourse) => {
                            const key = userCourse._id;

                            if (!userCourse.course) {
                              return (
                                <ContextMenu key={key}>
                                  <ContextMenuTrigger>
                                    <button
                                      type="button"
                                      draggable
                                      onDragStart={(e) =>
                                        handleInternalDragStart(e, userCourse)
                                      }
                                      onDragEnd={handleInternalDragEnd}
                                      className="block w-full text-left p-2 border border-dashed border-amber-500/50 rounded-md bg-amber-500/5"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-amber-900 dark:text-amber-300">
                                          {userCourse.title}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {userCourse.courseCode}
                                      </div>
                                    </button>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() =>
                                        handleDeleteCourse(userCourse)
                                      }
                                    >
                                      <Trash2Icon className="mr-2 h-4 w-4" />
                                      Delete
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            }

                            return (
                              <ContextMenu key={key}>
                                <ContextMenuTrigger asChild>
                                  <Link
                                    href={userCourse.course.courseUrl}
                                    target="_blank"
                                    draggable
                                    onDragStart={(e) =>
                                      handleInternalDragStart(e, userCourse)
                                    }
                                    onDragEnd={handleInternalDragEnd}
                                    className="block p-2 border rounded-md bg-card hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
                                  >
                                    <div className="font-medium text-sm">
                                      {userCourse.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {userCourse.course.code}
                                    </div>
                                  </Link>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      handleDeleteCourse(userCourse)
                                    }
                                  >
                                    <Trash2Icon className="mr-2 h-4 w-4" />
                                    Delete
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
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
