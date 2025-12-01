"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc, Id } from "@albert-plus/server/convex/_generated/dataModel";
import { useClerk, useUser } from "@clerk/nextjs";
import { useForm } from "@tanstack/react-form";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { FunctionArgs } from "convex/server";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { Activity } from "react";
import { toast } from "sonner";
import z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Field as UIField,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import MultipleSelector from "@/components/ui/multiselect";
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
import { useDebounce } from "@/hooks/use-debounce";
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
    // Final presentation invite
    attendPresentation: z.boolean().optional(),
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

export function OnboardingForm() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isAuthenticated } = useConvexAuth();
  const [isFileLoaded, setIsFileLoaded] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1);

  // actions
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);
  const importUserCourses = useMutation(api.userCourses.importUserCourses);
  const createInvite = useMutation(api.studentInvites.createInvite);

  // schools
  const schools = useQuery(
    api.schools.getSchools,
    isAuthenticated ? {} : ("skip" as const),
  );

  // Programs
  const [programSearchInput, setProgramSearchInput] =
    React.useState<string>("");
  const debouncedProgramSearch = useDebounce(programSearchInput, 300);

  const { results: programs } = usePaginatedQuery(
    api.programs.getPrograms,
    isAuthenticated
      ? { query: debouncedProgramSearch.trim() || undefined }
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

  // Cache to store program labels so they don't disappear when search results change
  const programLabelCache = React.useRef<Map<Id<"programs">, string>>(
    new Map(),
  );

  // Update cache whenever new programs are loaded
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
      // final presentation
      attendPresentation: false,
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

        if (value.attendPresentation && user) {
          await createInvite({
            name: user.fullName || "Unknown",
            email:
              user.primaryEmailAddress?.emailAddress || "unknown@example.com",
          });
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
        toast.error("Could not complete onboarding. Please try again.");
      }
    },
  });

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
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
                  Upload your degree progress report (PDF) so we can help you
                  track your academic progress and suggest courses.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOutIcon className="size-4" />
                Sign out
              </Button>
            </div>
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
      </Activity>

      <Activity mode={currentStep === 2 ? "visible" : "hidden"}>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl">Academic Information</CardTitle>
                <CardDescription>
                  Tell us about your academic background so we can personalize
                  your experience.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOutIcon className="size-4" />
                Sign out
              </Button>
            </div>
          </CardHeader>
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
                    label:
                      programOptions.find((val) => val.value === p)?.label ||
                      programLabelCache.current.get(p) ||
                      "",
                  }));
                  return (
                    <UIField>
                      <FieldLabel htmlFor={field.name}>
                        What's your major(s) and minor(s)?
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
                          placeholder="Select your programs"
                          commandProps={{
                            label: "Select programs",
                            shouldFilter: false,
                          }}
                          inputProps={{
                            onValueChange: (value) => {
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

              {/* Program timeline - start and end dates in one row */}
              <FieldGroup>
                <FieldLabel>When does your program start and end?</FieldLabel>
                <div className="rounded-lg border border-border/40 bg-muted/5 p-4">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                    {/* Starting date section */}
                    <div className="flex-1 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Start date
                      </div>
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
                    </div>

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

              <div className="rounded-lg border border-border/40 bg-muted/5 p-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">
                      Tech@NYU Final Presentation RSVP
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The Tech@NYU Dev Team will showcase the Albert Plus
                      project during our final presentation between December 7
                      and December 12, 2025. Let us know if you'd like to join
                      so we can send the exact date, time, and location details.
                    </p>
                  </div>
                  {/* Final presentation invite */}
                  <form.Field name="attendPresentation">
                    {(field) => (
                      <div className="space-y-2">
                        <UIField
                          orientation="horizontal"
                          className="items-start gap-3"
                        >
                          <Checkbox
                            id={field.name}
                            checked={Boolean(field.state.value)}
                            onCheckedChange={(checked) =>
                              field.handleChange(checked === true)
                            }
                            aria-describedby={`${field.name}-description`}
                          />
                          <FieldContent>
                            <Label
                              htmlFor={field.name}
                              className="text-sm font-medium leading-snug"
                            >
                              I plan to attend the final presentation
                            </Label>
                            <FieldDescription id={`${field.name}-description`}>
                              We'll email you an RSVP as soon as the schedule is
                              finalized.
                            </FieldDescription>
                          </FieldContent>
                        </UIField>
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <div className="ml-auto space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Activity>
    </form>
  );
}
