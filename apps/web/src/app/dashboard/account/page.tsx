"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc, Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useForm } from "@tanstack/react-form";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { FunctionArgs } from "convex/server";
import { Mail, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import z from "zod";
import { SchoolCombobox } from "@/app/onboarding/component/school-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FieldContent,
  FieldError,
  Field as UIField,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import type { UserCourse } from "@/modules/report-parsing/types";
import type { StartingTerm } from "@/modules/report-parsing/utils/parse-starting-term";
import { getTermAfterSemesters, type Term } from "@/utils/term";

const dateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  term: z.union([
    z.literal("spring"),
    z.literal("fall"),
    z.literal("j-term"),
    z.literal("summer"),
  ]),
});

const onboardingFormSchema = z
  .object({
    school: z.string({
      error: (issue) =>
        issue.input === undefined ? "Please select a school" : "Invalid input",
    }),
    programs: z.array(z.string()).min(1, "At least one program is required"),
    startingDate: dateSchema,
    expectedGraduationDate: dateSchema,
    // User courses
    userCourses: z.array(z.object()).optional(),
  })
  .refine(
    (data) => {
      const startYear = data.startingDate.year;
      const startTerm = data.startingDate.term;
      const endYear = data.expectedGraduationDate.year;
      const endTerm = data.expectedGraduationDate.term;

      // Convert to comparable numbers (spring=0, fall=1)
      const startValue = startYear * 2 + (startTerm === "fall" ? 1 : 0);
      const endValue = endYear * 2 + (endTerm === "fall" ? 1 : 0);

      return endValue > startValue;
    },
    {
      message: "Expected graduation date must be after starting date",
      path: ["expectedGraduationDate"],
    },
  );

function ProfileHeaderSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AcademicInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function DegreeProgressSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [isFileLoaded, setIsFileLoaded] = React.useState(false);

  const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

  const { user } = useUser();

  // Get tab from query params, default to "personal"
  const activeTab = searchParams.get("tab") || "personal";

  // Function to update tab in URL
  const setActiveTab = React.useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // actions
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);
  const updateStudent = useMutation(api.students.updateCurrentStudent);
  const importUserCourses = useMutation(api.userCourses.importUserCourses);

  // schools
  const schools = useQuery(
    api.schools.getSchools,
    isAuthenticated ? {} : ("skip" as const),
  );

  // Programs
  const [programSearchInput, setProgramSearchInput] =
    React.useState<string>("");

  const { results: programs } = usePaginatedQuery(
    api.programs.getPrograms,
    isAuthenticated
      ? { query: programSearchInput.trim() || undefined }
      : ("skip" as const),
    { initialNumItems: 20 },
  );

  const programOptions = React.useMemo(
    () =>
      (programs ?? []).map((program) => ({
        value: program._id,
        label: `${program.name} - ${program.school}`,
      })),
    [programs],
  );

  const programLabelCache = React.useRef<Map<Id<"programs">, string>>(
    new Map(),
  );

  React.useEffect(() => {
    programOptions.forEach((option) => {
      programLabelCache.current.set(
        option.value as Id<"programs">,
        option.label,
      );
    });
  }, [programOptions]);

  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const defaultTerm = React.useMemo<Term>(() => {
    const month = new Date().getMonth();
    return month >= 6 ? "fall" : "spring";
  }, []);
  const defaultStartingDate = {
    year: currentYear,
    term: defaultTerm,
  };
  const defaultExpectedGraduation = getTermAfterSemesters(
    {
      term: defaultTerm,
      year: currentYear,
    },
    14,
  );

  // Generate year options: currentYear ± 4 years
  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, [currentYear]);

  async function handleConfirmImport(
    coursesToImport: UserCourse[],
    startingTerm: StartingTerm | null,
  ) {
    if (coursesToImport.length === 0) {
      return;
    }

    // Update starting date if available
    if (startingTerm) {
      await updateStudent({ startingDate: startingTerm });
    }

    const result = await importUserCourses({ courses: coursesToImport });

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
    // Don't show "PDF Selected" state - reset to allow another upload
    setIsFileLoaded(false);
  }

  const form = useForm({
    defaultValues: {
      // student data
      school: undefined as Id<"schools"> | undefined,
      programs: [] as Id<"programs">[],
      startingDate: defaultStartingDate as Doc<"students">["startingDate"],
      expectedGraduationDate:
        defaultExpectedGraduation as Doc<"students">["expectedGraduationDate"],
      // user courses
      userCourses: undefined as
        | FunctionArgs<typeof api.userCourses.importUserCourses>["courses"]
        | undefined,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = onboardingFormSchema.safeParse(value);
        if (!result.success) {
          const fieldErrors: Record<string, { message: string }[]> = {};
          for (const issue of result.error.issues) {
            const path = issue.path.join(".");
            fieldErrors[path] = [{ message: issue.message }];
          }
          return {
            fields: fieldErrors,
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      if (editingProfile) {
        try {
          toast.success("Successfully updated profile.");
          // router.push("/dashboard");

          await upsertStudent({
            school: value.school as Id<"schools">,
            programs: value.programs,
            startingDate: value.startingDate,
            expectedGraduationDate: value.expectedGraduationDate,
          });

          setEditingProfile(false);

          if (value.userCourses) {
            await importUserCourses({ courses: value.userCourses });
          }
        } catch (error) {
          console.error("Error completing onboarding:", error);
          toast.error("Could not complete onboarding. Please try again.");
        }
      }
    },
  });

  React.useEffect(() => {
    if (!student) return;

    // school: student.school can be an object or null
    form.setFieldValue("school", student.school?._id ?? undefined);

    // programs: student.programs might be an array of objects or array of ids
    const programIds: Id<"programs">[] = [];
    (student.programs ?? []).forEach(
      (
        p:
          | Id<"programs">
          | { _id: Id<"programs">; name: string; school?: string },
      ) => {
        const id = typeof p === "string" ? p : p._id;
        programIds.push(id);

        // Populate cache with existing student programs
        if (typeof p !== "string" && p.name) {
          const label = p.school ? `${p.name} - ${p.school}` : p.name;
          programLabelCache.current.set(id, label);
        }
      },
    );

    form.setFieldValue("programs", programIds);
  }, [student, form.setFieldValue]);

  // Loading state - student is undefined while loading
  const isLoading = student === undefined;

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {isLoading ? (
          <ProfileHeaderSkeleton />
        ) : (
          <Card>
            <CardContent>
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                <div className="relative">
                  <Avatar className="inline-block h-20 w-20 rounded-full overflow-hidden">
                    {user?.imageUrl ? (
                      <AvatarImage
                        src={user.imageUrl}
                        alt={user.fullName || "User avatar"}
                        className="block h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="flex h-full w-full items-center justify-center bg-gray-200 text-base font-medium">
                        {`${user?.firstName?.[0] || "U"}${user?.lastName?.[0] || "U"}`}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <h1 className="text-2xl font-bold">
                      {user?.fullName || "Unknown User"}
                    </h1>
                  </div>
                  {student && (
                    <p className="text-muted-foreground">
                      {student.school?.level
                        ? student.school.level.charAt(0).toUpperCase() +
                          student.school.level.slice(1).toLowerCase() +
                          " Student"
                        : "Student"}
                    </p>
                  )}
                  <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Mail className="size-4" />
                      {user?.primaryEmailAddress?.emailAddress || ""}
                    </div>
                    {student?.school?.name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {student.school.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Academic Profile</TabsTrigger>
          <TabsTrigger value="degreeProgressReport">
            Degree Progress Report
          </TabsTrigger>
        </TabsList>

        {/* Academic Profile Tab */}
        <TabsContent value="personal" className="space-y-6">
          {isLoading ? (
            <AcademicInfoSkeleton />
          ) : student ? (
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>
                  View and update your academic information here.
                </CardDescription>
              </CardHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-6"
              >
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">School</Label>
                      {editingProfile && (
                        <form.Field name="school">
                          {(field) => {
                            return (
                              <UIField>
                                <FieldContent>
                                  <SchoolCombobox
                                    id={field.name}
                                    schools={schools}
                                    value={field.state.value}
                                    onValueChange={(value) =>
                                      field.handleChange(value)
                                    }
                                  />
                                </FieldContent>
                                <FieldError errors={field.state.meta.errors} />
                              </UIField>
                            );
                          }}
                        </form.Field>
                      )}
                      {!editingProfile && (
                        <p className="text-sm text-muted-foreground">
                          {student.school
                            ? `${student.school.name} (${
                                student.school.level
                                  ? student.school.level
                                      .charAt(0)
                                      .toUpperCase() +
                                    student.school.level.slice(1).toLowerCase()
                                  : ""
                              })`
                            : "N/A"}
                        </p>
                      )}
                      {/* <Input id="firstName" defaultValue="John" /> */}
                    </div>
                    <div className="space-y-2">
                      <Label>Programs</Label>
                      {!editingProfile && (
                        <p className="text-sm text-muted-foreground">
                          {student.programs?.length > 0
                            ? student.programs.map((p) => p.name).join(", ")
                            : "None"}
                        </p>
                      )}
                      {editingProfile && (
                        <form.Field name="programs">
                          {(field) => {
                            const selected = (field.state.value ?? []).map(
                              (p) => ({
                                value: p,
                                label:
                                  programOptions.find((val) => val.value === p)
                                    ?.label ||
                                  programLabelCache.current.get(p) ||
                                  "",
                              }),
                            );
                            return (
                              <UIField>
                                <FieldContent>
                                  <MultipleSelector
                                    value={selected}
                                    onChange={(opts: Option[]) =>
                                      field.handleChange(
                                        opts.map(
                                          (o) => o.value as Id<"programs">,
                                        ),
                                      )
                                    }
                                    defaultOptions={programOptions}
                                    options={programOptions}
                                    placeholder="Select your programs"
                                    commandProps={{
                                      label: "Select programs",
                                      shouldFilter: false,
                                    }}
                                    inputProps={{
                                      onValueChange: (value: string) => {
                                        setProgramSearchInput(value);
                                      },
                                    }}
                                    emptyIndicator={
                                      <p className="text-center text-sm">
                                        No programs found
                                      </p>
                                    }
                                  />
                                </FieldContent>
                                <FieldError errors={field.state.meta.errors} />
                              </UIField>
                            );
                          }}
                        </form.Field>
                      )}

                      {/* <Input id="lastName" defaultValue="Doe" /> */}
                    </div>
                    <div className="space-y-2">
                      <Label>Enrollment Start Date</Label>
                      {editingProfile && (
                        <div className="flex gap-2">
                          {/* startingDate.term */}
                          <form.Field name="startingDate.term">
                            {(field) => (
                              <Select
                                value={field.state.value ?? ""}
                                onValueChange={(val) =>
                                  field.handleChange(val as Term)
                                }
                              >
                                <SelectTrigger
                                  aria-invalid={!field.state.meta.isValid}
                                >
                                  <SelectValue placeholder="Term" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spring">Spring</SelectItem>
                                  <SelectItem value="summer">Summer</SelectItem>
                                  <SelectItem value="fall">Fall</SelectItem>
                                  <SelectItem value="j-term">Winter</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </form.Field>
                          {/* startingDate.year */}
                          <form.Field name="startingDate.year">
                            {(field) => (
                              <Select
                                value={field.state.value?.toString() ?? ""}
                                onValueChange={(val) =>
                                  field.handleChange(Number.parseInt(val, 10))
                                }
                              >
                                <SelectTrigger
                                  aria-invalid={!field.state.meta.isValid}
                                >
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {yearOptions.map((year) => (
                                    <SelectItem
                                      key={year}
                                      value={year.toString()}
                                    >
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </form.Field>
                        </div>
                      )}
                      {!editingProfile && (
                        <p className="text-sm text-muted-foreground">
                          {student.startingDate
                            ? `${student.startingDate.term.charAt(0).toUpperCase()}${student.startingDate.term.slice(1)} ${student.startingDate.year}`
                            : "N/A"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Expected Graduation Date</Label>
                      {editingProfile && (
                        <div className="flex gap-2">
                          {/* expectedGraduationDate.term */}
                          <form.Field name="expectedGraduationDate.term">
                            {(field) => (
                              <Select
                                value={field.state.value ?? ""}
                                onValueChange={(val) =>
                                  field.handleChange(val as Term)
                                }
                              >
                                <SelectTrigger
                                  aria-invalid={!field.state.meta.isValid}
                                >
                                  <SelectValue placeholder="Term" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spring">Spring</SelectItem>
                                  <SelectItem value="summer">Summer</SelectItem>
                                  <SelectItem value="fall">Fall</SelectItem>
                                  <SelectItem value="j-term">Winter</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </form.Field>
                          {/* expectedGraduationDate.year */}
                          <form.Field name="expectedGraduationDate.year">
                            {(field) => (
                              <Select
                                value={field.state.value?.toString() ?? ""}
                                onValueChange={(val) =>
                                  field.handleChange(Number.parseInt(val, 10))
                                }
                              >
                                <SelectTrigger
                                  aria-invalid={!field.state.meta.isValid}
                                >
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {yearOptions.map((year) => (
                                    <SelectItem
                                      key={year}
                                      value={year.toString()}
                                    >
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </form.Field>
                        </div>
                      )}
                      {!editingProfile && (
                        <p className="text-sm text-muted-foreground">
                          {student.expectedGraduationDate
                            ? `${student.expectedGraduationDate.term.charAt(0).toUpperCase()}${student.expectedGraduationDate.term.slice(1)} ${student.expectedGraduationDate.year}`
                            : "N/A"}
                        </p>
                      )}
                    </div>

                    {!editingProfile ? (
                      <Button
                        type="button"
                        className="w-auto max-w-fit"
                        onClick={() => setEditingProfile(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={form.state.isSubmitting}
                          className="w-auto max-w-fit"
                        >
                          {form.state.isSubmitting
                            ? "Saving..."
                            : "Save Changes"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-auto max-w-fit"
                          onClick={() => setEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </form>
            </Card>
          ) : null}
        </TabsContent>

        {/* Degree Progress Report Tab */}
        <TabsContent value="degreeProgressReport">
          {isLoading ? (
            <DegreeProgressSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Degree Progress Report
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-help size-5 rounded-full p-0 text-xs hover:bg-muted"
                      >
                        ?
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        We do not store your degree progress report. Need help
                        finding it?{" "}
                        <a
                          href="https://www.nyu.edu/students/student-information-and-resources/registration-records-and-graduation/registration/tracking-degree-progress.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          View NYU's guide
                        </a>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>
                  Upload a PDF of your degree progress report so we can help you
                  track your academic progress and suggest courses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DegreeProgreeUpload
                  onConfirm={handleConfirmImport}
                  showFileLoaded={isFileLoaded}
                  onFileClick={() => setIsFileLoaded(false)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
