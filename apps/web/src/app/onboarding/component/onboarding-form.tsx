"use client";

import MultipleSelector from "@/app/onboarding/component/multiselect";
import { SchoolCombobox } from "@/app/onboarding/component/school-combobox";
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
  FieldGroup,
  FieldLabel,
  Field as UIField,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import type { UserCourse } from "@/modules/report-parsing/types";
import { userCourseSchema } from "@/schemas/courses";
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
import React from "react";
import { toast } from "sonner";
import z from "zod";

const dateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  term: z.union([z.literal("spring"), z.literal("fall")]),
});

const onboardingFormSchema = z.object({
  // Student data
  school: z.string().transform((value) => value as Id<"schools">),
  programs: z.array(z.string()).min(1, "At least one program is required"),
  startingDate: dateSchema,
  expectedGraduationDate: dateSchema,
  // User courses
  userCourses: z.array(userCourseSchema).default([]),
});
// .refine(
//   (data) => {
//     const startYear = data.startingDate.year;
//     const startTerm = data.startingDate.term;
//     const endYear = data.expectedGraduationDate.year;
//     const endTerm = data.expectedGraduationDate.term;
//
//     // Convert to comparable numbers (spring=0, fall=1)
//     const startValue = startYear * 2 + (startTerm === "fall" ? 1 : 0);
//     const endValue = endYear * 2 + (endTerm === "fall" ? 1 : 0);
//
//     return endValue > startValue;
//   },
//   {
//     message: "Expected graduation date must be after starting date",
//     path: ["expectedGraduationDate"],
//   },
// );

export function OnboardingForm() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [isFileLoaded, setIsFileLoaded] = React.useState(false);

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
  const defaultTerm = React.useMemo<"spring" | "fall">(() => {
    const month = new Date().getMonth();
    return month >= 6 ? "fall" : "spring";
  }, []);

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
      startingDate: {
        year: currentYear,
        term: defaultTerm,
      } as Doc<"students">["startingDate"],
      expectedGraduationDate: {
        year: currentYear + 4,
        term: defaultTerm,
      } as Doc<"students">["expectedGraduationDate"],
      // user courses
      userCourses: [] as FunctionArgs<
        typeof api.userCourses.importUserCourses
      >["courses"],
    },
    onSubmit: async ({ value }) => {
      try {
        await upsertStudent({
          school: value.school,
          programs: value.programs,
          startingDate: value.startingDate,
          expectedGraduationDate: value.expectedGraduationDate,
        });

        await importUserCourses({ courses: value.userCourses });

        toast.success("Onboarding completed. Redirecting to dashboard...");
        router.push("/dashboard");
      } catch (error) {
        console.error("Error completing onboarding:", error);
        toast.error("Could not complete onboarding. Please try again.");
      }
    },
  });

  function handleConfirmImport(coursesToImport: UserCourse[]) {
    if (coursesToImport.length === 0) {
      return;
    }

    form.setFieldValue("userCourses", coursesToImport);
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Academic Information</CardTitle>
          <CardDescription>
            Tell us about your academic background so we can personalize your
            experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {/* school */}
            <form.Field name="school">
              {(field) => {
                return (
                  <UIField>
                    <FieldLabel htmlFor={field.name}>
                      What school or college of NYU do you go to?
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
              <FieldLabel>When does your program start and end?</FieldLabel>
              <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                {/* Starting date section */}
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium">Start date</div>
                  <div className="flex gap-2">
                    {/* startingDate.term */}
                    <form.Field name="startingDate.term">
                      {(field) => {
                        return (
                          <UIField className="w-28">
                            <FieldContent>
                              <Select
                                value={field.state.value ?? ""}
                                onValueChange={(val) =>
                                  field.handleChange(val as "spring" | "fall")
                                }
                              >
                                <SelectTrigger
                                  aria-invalid={!field.state.meta.isValid}
                                >
                                  <SelectValue placeholder="Term" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spring">Spring</SelectItem>
                                  <SelectItem value="fall">Fall</SelectItem>
                                </SelectContent>
                              </Select>
                            </FieldContent>
                            <FieldError errors={field.state.meta.errors} />
                          </UIField>
                        );
                      }}
                    </form.Field>
                    {/* startingDate.year */}
                    <form.Field name="startingDate.year">
                      {(field) => {
                        return (
                          <UIField className="flex-1">
                            <FieldContent>
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
                            </FieldContent>
                            <FieldError errors={field.state.meta.errors} />
                          </UIField>
                        );
                      }}
                    </form.Field>
                  </div>
                </div>

                {/* "To" separator */}
                <div className="hidden lg:flex items-center pb-2 text-sm text-muted-foreground">
                  to
                </div>

                {/* Expected graduation date section */}
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium">Expected graduation</div>
                  <div className="flex gap-2">
                    {/* expectedGraduationDate.term */}
                    <form.Field name="expectedGraduationDate.term">
                      {(field) => {
                        return (
                          <UIField className="w-28">
                            <FieldContent>
                              <Select
                                value={field.state.value ?? ""}
                                onValueChange={(val) =>
                                  field.handleChange(val as "spring" | "fall")
                                }
                              >
                                <SelectTrigger
                                  aria-invalid={!field.state.meta.isValid}
                                >
                                  <SelectValue placeholder="Term" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spring">Spring</SelectItem>
                                  <SelectItem value="fall">Fall</SelectItem>
                                </SelectContent>
                              </Select>
                            </FieldContent>
                            <FieldError errors={field.state.meta.errors} />
                          </UIField>
                        );
                      }}
                    </form.Field>
                    {/* expectedGraduationDate.year */}
                    <form.Field name="expectedGraduationDate.year">
                      {(field) => {
                        return (
                          <UIField className="flex-1">
                            <FieldContent>
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
                            </FieldContent>
                            <FieldError errors={field.state.meta.errors} />
                          </UIField>
                        );
                      }}
                    </form.Field>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Degree Progress Report (Optional)
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
              form.setFieldValue("userCourses", []);
              setIsFileLoaded(false);
            }}
          />
        </CardContent>
      </Card>

      {/* <section className="space-y-6"> */}
      {/*   <header className="space-y-2"> */}
      {/*     <h2 className="text-2xl font-semibold">Chrome Extension</h2> */}
      {/*     <p className="text-muted-foreground text-sm"> */}
      {/*       Install our Chrome extension to keep track of courses while browsing */}
      {/*       your university catalog. */}
      {/*     </p> */}
      {/*   </header> */}
      {/*   <div className="space-y-4 text-start"> */}
      {/*     <div className="space-y-4"> */}
      {/*       <div className="rounded-lg border p-4 bg-gray-50"> */}
      {/*         <h3 className="font-semibold text-gray-900 mb-2"> */}
      {/*           Chrome Extension */}
      {/*         </h3> */}
      {/*         <p className="text-sm text-gray-700 mb-4"> */}
      {/*           The Chrome extension will help you automatically track courses */}
      {/*           and prerequisites while browsing your university&apos;s course */}
      {/*           catalog. */}
      {/*         </p> */}
      {/*         <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md inline-block"> */}
      {/*           Extension installation */}
      {/*         </div> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </section> */}

      <div className="flex justify-end">
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
