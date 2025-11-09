"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
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
import {
  type AcademicInfoFormValues,
  academicInfoSchema,
} from "./stepper-pages/academic-info-form";
import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Controller,
  FormProvider,
  type FieldError as RHFFieldError,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const programOptions: string[] = [];

type OnboardingFormValues = AcademicInfoFormValues;

interface OnboardingFormProps {
  student: Doc<"students"> | null;
}

export function OnboardingForm({ student }: OnboardingFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const schools = useQuery(api.schools.getSchools);
  const isLoadingSchools = schools === undefined;

  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const defaultTerm = React.useMemo<"spring" | "fall">(() => {
    const month = new Date().getMonth();
    return month >= 6 ? "fall" : "spring";
  }, []);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(academicInfoSchema),
    defaultValues: {
      school: student?.school ?? "",
      programs: [],
      startingDate: student?.startingDate ?? {
        year: currentYear,
        term: defaultTerm,
      },
      expectedGraduationDate: student?.expectedGraduationDate ?? {
        year: currentYear + 4,
        term: defaultTerm,
      },
    },
  });

  const {
    control,
    formState: { errors },
  } = form;

  const toErrorArray = React.useCallback(
    (error?: RHFFieldError) =>
      error ? [{ message: error.message }] : undefined,
    [],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await upsertStudent({
        school: values.school as Doc<"students">["school"],
        programs: [],
        startingDate: values.startingDate,
        expectedGraduationDate: values.expectedGraduationDate,
        isOnboarded: true,
      });

      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboarding_completed: true,
        },
      });

      toast.success("Onboarding completed. Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Could not complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
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
            <Controller
              control={control}
              name="school"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    What school or college do you go to?
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingSchools}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your school or college" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {isLoadingSchools ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading schools...
                          </div>
                        ) : schools?.length ? (
                          schools.map((school) => (
                            <SelectItem key={school._id} value={school.name}>
                              {school.name}
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
                  <FieldError errors={toErrorArray(fieldState.error)} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="programs"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    Please select your program (major and minor)
                  </FieldLabel>
                  <FieldContent>
                    <MultipleSelector
                      value={(field.value ?? []).map((program) => ({
                        value: program,
                        label: program,
                      }))}
                      onChange={(options) => {
                        const values = options.map((option) => option.value);
                        field.onChange(values);
                      }}
                      defaultOptions={programOptions.map((program) => ({
                        value: program,
                        label: program,
                      }))}
                      placeholder="Select your programs"
                      commandProps={{
                        label: "Select programs",
                      }}
                      emptyIndicator={
                        <p className="text-center text-sm">No programs found</p>
                      }
                    />
                  </FieldContent>
                  <FieldError errors={toErrorArray(fieldState.error)} />
                </Field>
              )}
            />

            <FieldGroup className="space-y-4">
              <FieldLabel className="text-sm font-medium text-gray-700">
                When did you start your program?
              </FieldLabel>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="startingDate.year"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Year</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min="2000"
                          max="2100"
                          ref={field.ref}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const { value } = event.target;
                            field.onChange(
                              value === ""
                                ? undefined
                                : Number.parseInt(value, 10),
                            );
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FieldContent>
                      <FieldError errors={toErrorArray(fieldState.error)} />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="startingDate.term"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Term</FieldLabel>
                      <FieldContent>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fall">Fall</SelectItem>
                            <SelectItem value="spring">Spring</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                      <FieldError errors={toErrorArray(fieldState.error)} />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>

            <FieldGroup className="space-y-4">
              <FieldLabel className="text-sm font-medium text-gray-700">
                When do you expect to graduate?
              </FieldLabel>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="expectedGraduationDate.year"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Year</FieldLabel>
                      <FieldContent>
                        <Input
                          type="number"
                          min="2000"
                          max="2100"
                          ref={field.ref}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const { value } = event.target;
                            field.onChange(
                              value === ""
                                ? undefined
                                : Number.parseInt(value, 10),
                            );
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FieldContent>
                      <FieldError errors={toErrorArray(fieldState.error)} />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="expectedGraduationDate.term"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Term</FieldLabel>
                      <FieldContent>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spring">Spring</SelectItem>
                            <SelectItem value="fall">Fall</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                      <FieldError errors={toErrorArray(fieldState.error)} />
                    </Field>
                  )}
                />
              </div>
              <FieldError
                errors={toErrorArray(
                  errors.expectedGraduationDate as RHFFieldError,
                )}
              />
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
              Install our Chrome extension to keep track of courses while
              browsing your university catalog.
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Completing..." : "Complete Onboarding"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
