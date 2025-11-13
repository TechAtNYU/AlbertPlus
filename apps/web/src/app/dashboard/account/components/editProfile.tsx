"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc, Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { FunctionArgs } from "convex/server";
import { useRouter } from "next/navigation";
import React, { Activity } from "react";
import { toast } from "sonner";
import z from "zod";
import MultipleSelector from "@/app/onboarding/component/multiselect";
import { SchoolCombobox } from "@/app/onboarding/component/school-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  Field as UIField,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import type { UserCourse } from "@/modules/report-parsing/types";
import type { StartingTerm } from "@/modules/report-parsing/utils/parse-starting-term";
import { getTermAfterSemesters, type Term } from "@/utils/term";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from "@clerk/nextjs";

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

export function EditProfilePopup() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [isFileLoaded, setIsFileLoaded] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1);

    const { user } = useUser();

    const student = useQuery(
        api.students.getCurrentStudent,
        isAuthenticated ? {} : "skip",
    );

  // actions
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);
  const importUserCourses = useMutation(api.userCourses.importUserCourses);

  // schools
  const schools = useQuery(
    api.schools.getSchools,
    isAuthenticated ? {} : ("skip" as const),
  );

  // Programs
  const [programsQuery, setProgramsQuery] = React.useState<string | undefined>(
    undefined,
  );
  const {
    results: programs,
    status: programsStatus,
    loadMore: programsLoadMore,
  } = usePaginatedQuery(
    api.programs.getPrograms,
    isAuthenticated ? { query: programsQuery } : ("skip" as const),
    { initialNumItems: 20 },
  );

  const programOptions = React.useMemo(
    () =>
      (programs ?? []).map((program) => ({
        value: program._id,
        label: program.name,
      })),
    [programs],
  );

  const handleSearchPrograms = React.useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setProgramsQuery(trimmed.length === 0 ? undefined : trimmed);
      return programOptions;
    },
    [programOptions],
  );

  const handleLoadMorePrograms = React.useCallback(() => {
    if (programsStatus === "CanLoadMore") {
      void programsLoadMore(10);
    }
  }, [programsStatus, programsLoadMore]);

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
      try {
        toast.success("Onboarding completed.");
        router.push("/dashboard");

        await upsertStudent({
          school: value.school as Id<"schools">,
          programs: value.programs,
          startingDate: value.startingDate,
          expectedGraduationDate: value.expectedGraduationDate,
        });

        if (value.userCourses) {
          await importUserCourses({ courses: value.userCourses });
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
        toast.error("Could not complete onboarding. Please try again.");
      }
    },
  });

  React.useEffect(() => {
    if (!student) return;

    // school: student.school can be an object or null
    form.setFieldValue("school", student.school?._id ?? undefined);

    // programs: student.programs might be an array of objects or array of ids
    const programIds: Id<"programs">[] =
        (student.programs ?? []).map((p: any) =>
        typeof p === "string" ? (p as Id<"programs">) : (p?._id as Id<"programs">),
        );

    form.setFieldValue("programs", programIds);

    // dates — assume these are already shaped correctly
    if (student.startingDate) {
        form.setFieldValue("startingDate", student.startingDate);
    }
    if (student.expectedGraduationDate) {
        form.setFieldValue("expectedGraduationDate", student.expectedGraduationDate);
    }
    }, [student]);

  function handleConfirmImport(
    coursesToImport: UserCourse[],
    startingTerm: StartingTerm | null,
  ) {
    if (coursesToImport.length === 0) {
      return;
    }

    form.setFieldValue("userCourses", coursesToImport);

    if (startingTerm) {
      form.setFieldValue("startingDate", startingTerm);
      form.setFieldValue(
        "expectedGraduationDate",
        getTermAfterSemesters(startingTerm, 14),
      );
    }

    setIsFileLoaded(true);
  }

  function DegreeProgressUpload() {
    return (
        <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <Activity mode={currentStep === 1 ? "visible" : "hidden"}>
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
              Upload your degree progress report (PDF) so we can help you track
              your academic progress and suggest courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DegreeProgreeUpload
              onConfirm={handleConfirmImport}
              showFileLoaded={isFileLoaded}
              onFileClick={() => {
                form.setFieldValue("userCourses", undefined);
                form.setFieldValue("startingDate", defaultStartingDate);
                form.setFieldValue(
                  "expectedGraduationDate",
                  defaultExpectedGraduation,
                );
                setIsFileLoaded(false);
              }}
            />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
        </CardFooter>
        </Card>
      </Activity>

    </form>
    )
  }

  function Form() {
    return (
        <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* <Activity mode={currentStep === 1 ? "visible" : "hidden"}>
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
              Upload your degree progress report (PDF) so we can help you track
              your academic progress and suggest courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DegreeProgreeUpload
              onConfirm={handleConfirmImport}
              showFileLoaded={isFileLoaded}
              onFileClick={() => {
                form.setFieldValue("userCourses", undefined);
                form.setFieldValue("startingDate", defaultStartingDate);
                form.setFieldValue(
                  "expectedGraduationDate",
                  defaultExpectedGraduation,
                );
                setIsFileLoaded(false);
              }}
            />
          </CardContent>
          <CardFooter>
            <div className="ml-auto space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setFieldValue("userCourses", undefined);
                  form.setFieldValue("startingDate", defaultStartingDate);
                  form.setFieldValue(
                    "expectedGraduationDate",
                    defaultExpectedGraduation,
                  );
                  setIsFileLoaded(false);
                  setCurrentStep(2);
                }}
              >
                Skip for now
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                }}
                disabled={!isFileLoaded}
              >
                Continue
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Activity> */}

      <Activity mode={currentStep === 1 ? "visible" : "hidden"}>
        <Card>
          {/* <CardHeader>
            <CardTitle className="text-2xl">Academic Information</CardTitle>
            <CardDescription>
              Tell us about your academic background so we can personalize your
              experience.
            </CardDescription>
          </CardHeader> */}
          <CardContent>
            <FieldGroup>
              {/* school */}
              <form.Field name="school">
                {(field) => {
                  return (
                    <UIField>
                      <FieldLabel htmlFor={field.name}>
                        What school or college of NYU do you attend?
                      </FieldLabel>
                      <FieldContent>
                        <SchoolCombobox
                          id={field.name}
                          schools={schools}
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                        />
                      </FieldContent>
                      <FieldError errors={field.state.meta.errors} />
                    </UIField>
                  );
                }}
              </form.Field>

              {/* programs (multi-select) */}
              <form.Field name="programs">
                {(field) => {
                  const selected = (field.state.value ?? []).map((p) => ({
                    value: p,
                    label: programOptions.find((val) => val.value === p)
                      ?.label as string,
                  }));
                  return (
                    <UIField>
                      <FieldLabel htmlFor={field.name}>
                        What are your major(s) and minor(s)?
                      </FieldLabel>
                      <FieldContent>
                        <MultipleSelector
                          value={selected}
                          onChange={(opts) =>
                            field.handleChange(
                              opts.map((o) => o.value as Id<"programs">),
                            )
                          }
                          defaultOptions={programOptions}
                          options={programOptions}
                          delay={300}
                          onSearch={handleSearchPrograms}
                          triggerSearchOnFocus
                          placeholder="Select your programs"
                          commandProps={{ label: "Select programs" }}
                          onListReachEnd={handleLoadMorePrograms}
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

              {/* Program timeline - start and end dates in one row */}
              <FieldGroup>
                <FieldLabel>When does your program end?</FieldLabel>
                <div className="rounded-lg border border-border/40 bg-muted/5 p-4">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

                    {/* Expected graduation date section */}
                    <div className="flex-1 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Expected graduation
                      </div>
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
                    </div>
                  </div>
                </div>

                {/* Aggregate object-level errors (from Zod refine, etc.) */}
                <form.Field name="expectedGraduationDate">
                  {(field) => <FieldError errors={field.state.meta.errors} />}
                </form.Field>
              </FieldGroup>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
        </CardFooter>
        </Card>
      </Activity>
    </form>
    )
  }

  return (
    <div>
      <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <Form/>
          {/* <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
          </div> */}
          {/* <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter> */}
        </DialogContent>
      </form>
        </Dialog>

        <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Reupload Degree Progress Report</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reupload Degree Progress Report</DialogTitle>
            {/* <DialogDescription>
              Reupload your degree progress report here. Click save when you&apos;re
              done.
            </DialogDescription> */}
          </DialogHeader>
          <DegreeProgressUpload/>
          {/* <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
          </div> */}
          {/* <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter> */}
        </DialogContent>
      </form>
        </Dialog>
    </div>
    
  );
}
