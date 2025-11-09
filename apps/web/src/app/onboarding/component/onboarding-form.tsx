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
import React from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Field as UIField,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import MultipleSelector from "@/components/ui/multiselect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import { schoolNameSchema, userCourseSchema } from "@/schemas/courses";

const dateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  term: z.union([z.literal("spring"), z.literal("fall")]),
});

const onboardingFormSchema = z.object({
  // Student data
  school: schoolNameSchema,
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

  const form = useForm({
    defaultValues: {
      // student data
      school: "" as Doc<"students">["school"],
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-10"
    >
      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Academic Information</h2>
          <p className="text-muted-foreground text-sm">
            Tell us about your academic background so we can personalize your
            experience.
          </p>
        </header>

        <FieldSet className="space-y-6 text-start">
          {/* school */}
          <form.Field name="school">
            {(field) => {
              const invalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <UIField data-invalid={invalid}>
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    What school or college do you go to?
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(val) => field.handleChange(val)}
                      value={field.state.value ?? ""}
                      disabled={!schools === undefined}
                    >
                      <SelectTrigger className="w-full" aria-invalid={invalid}>
                        <SelectValue placeholder="Select your school or college" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {schools === undefined ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading schools...
                          </div>
                        ) : schools?.length ? (
                          schools.map((s) => (
                            <SelectItem key={s._id} value={s.name}>
                              {s.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No schools available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  <FieldError errors={field.state.meta.errors} />
                </UIField>
              );
            }}
          </form.Field>

          {/* programs (multi-select) */}
          <form.Field name="programs">
            {(field) => {
              const invalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const selected = (field.state.value ?? []).map((p) => ({
                value: p,
                label: p,
              }));
              return (
                <UIField data-invalid={invalid} className="gap-2">
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    Please select your program (major and minor)
                  </FieldLabel>
                  <FieldContent>
                    <MultipleSelector
                      value={selected}
                      onChange={(opts) =>
                        field.handleChange(opts.map((o) => o.value))
                      }
                      defaultOptions={programOptions}
                      options={programOptions}
                      delay={300}
                      onSearch={handleSearchPrograms}
                      triggerSearchOnFocus
                      placeholder="Select your programs"
                      commandProps={{ label: "Select programs" }}
                      emptyIndicator={
                        <p className="text-center text-sm">No programs found</p>
                      }
                    />
                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span>
                        Loaded {programOptions.length} program
                        {programOptions.length === 1 ? "" : "s"}
                        {programsStatus === "CanLoadMore"
                          ? " (more available)"
                          : programsStatus === "LoadingMore"
                            ? " (loading more...)"
                            : ""}
                      </span>
                      {programsStatus && programsStatus !== "Exhausted" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleLoadMorePrograms}
                          disabled={programsStatus !== "CanLoadMore"}
                        >
                          {programsStatus === "LoadingMore"
                            ? "Loading..."
                            : "Load 10 more"}
                        </Button>
                      )}
                    </div>
                  </FieldContent>
                  <FieldError errors={field.state.meta.errors} />
                </UIField>
              );
            }}
          </form.Field>

          {/* startingDate */}
          <FieldGroup className="space-y-4">
            <FieldLabel className="text-sm font-medium text-gray-700">
              When did you start your program?
            </FieldLabel>
            <div className="grid grid-cols-2 gap-4">
              {/* startingDate.year */}
              <form.Field name="startingDate.year">
                {(field) => {
                  const invalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <UIField data-invalid={invalid}>
                      <FieldLabel>Year</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min="2000"
                          max="2100"
                          name={field.name}
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.handleChange((prev) =>
                              v === "" ? prev : Number.parseInt(v, 10),
                            );
                          }}
                          aria-invalid={invalid}
                        />
                      </FieldContent>
                      <FieldError errors={field.state.meta.errors} />
                    </UIField>
                  );
                }}
              </form.Field>
              {/* startingDate.term */}
              <form.Field name="startingDate.term">
                {(field) => {
                  const invalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <UIField data-invalid={invalid}>
                      <FieldLabel>Term</FieldLabel>
                      <FieldContent>
                        <Select
                          value={field.state.value ?? ""}
                          onValueChange={(val) =>
                            field.handleChange(val as "spring" | "fall")
                          }
                        >
                          <SelectTrigger aria-invalid={invalid}>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fall">Fall</SelectItem>
                            <SelectItem value="spring">Spring</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                      <FieldError errors={field.state.meta.errors} />
                    </UIField>
                  );
                }}
              </form.Field>
            </div>
          </FieldGroup>

          {/* expectedGraduationDate */}
          <FieldGroup className="space-y-4">
            <FieldLabel className="text-sm font-medium text-gray-700">
              When do you expect to graduate?
            </FieldLabel>
            <div className="grid grid-cols-2 gap-4">
              {/* expectedGraduationDate.year */}
              <form.Field name="expectedGraduationDate.year">
                {(field) => {
                  const invalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <UIField data-invalid={invalid}>
                      <FieldLabel>Year</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min="2000"
                          max="2100"
                          name={field.name}
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.handleChange((prev) =>
                              v === "" ? prev : Number.parseInt(v, 10),
                            );
                          }}
                          aria-invalid={invalid}
                        />
                      </FieldContent>
                      <FieldError errors={field.state.meta.errors} />
                    </UIField>
                  );
                }}
              </form.Field>
              {/* expectedGraduationDate.term */}
              <form.Field name="expectedGraduationDate.term">
                {(field) => {
                  const invalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <UIField data-invalid={invalid}>
                      <FieldLabel>Term</FieldLabel>
                      <FieldContent>
                        <Select
                          value={field.state.value ?? ""}
                          onValueChange={(val) =>
                            field.handleChange(val as "spring" | "fall")
                          }
                        >
                          <SelectTrigger aria-invalid={invalid}>
                            <SelectValue placeholder="Select term" />
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
            </div>

            {/* Aggregate object-level errors (from Zod refine, etc.) */}
            <form.Field name="expectedGraduationDate">
              {(field) => <FieldError errors={field.state.meta.errors} />}
            </form.Field>
          </FieldGroup>
        </FieldSet>
      </section>

      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Degree Report</h2>
          <p className="text-muted-foreground text-sm">
            Upload your degree progress report.
          </p>
        </header>
        <div className="space-y-4 text-start">
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold text-black mb-2">
                Upload Your Degree Progress Report
              </h3>
              <p className="text-sm text-black mb-4">
                Upload your degree progress report (PDF) so we can help you
                track your academic progress and suggest courses.
              </p>
              <div className="space-y-4">
                <DegreeProgreeUpload maxSizeMB={20} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Chrome Extension</h2>
          <p className="text-muted-foreground text-sm">
            Install our Chrome extension to keep track of courses while browsing
            your university catalog.
          </p>
        </header>
        <div className="space-y-4 text-start">
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">
                Chrome Extension
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                The Chrome extension will help you automatically track courses
                and prerequisites while browsing your university&apos;s course
                catalog.
              </p>
              <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md inline-block">
                Extension installation
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? "Completing..." : "Complete Onboarding"}
        </Button>
      </div>
    </form>
  );
}
