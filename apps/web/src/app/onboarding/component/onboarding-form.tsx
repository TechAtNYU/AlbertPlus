"use client";

import { Button } from "@/components/ui/button";
import {
  AcademicInfoForm,
  type AcademicInfoFormValues,
  academicInfoSchema,
} from "./stepper-pages/academic-info-form";
import { ReportUploadForm } from "./stepper-pages/report-upload-form";
import { ExtensionForm } from "./stepper-pages/extention-form";
import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

type OnboardingFormValues = AcademicInfoFormValues;

interface OnboardingFormProps {
  student: Doc<"students"> | null;
}

export function OnboardingForm({ student }: OnboardingFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await upsertStudent({
        school: values.school,
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
          <AcademicInfoForm />
        </section>

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold">Degree Report</h2>
            <p className="text-muted-foreground text-sm">
              Upload your degree progress report. We’ll analyze it to recommend
              the best courses for you.
            </p>
          </header>
          <ReportUploadForm />
        </section>

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold">Chrome Extension</h2>
            <p className="text-muted-foreground text-sm">
              Install our Chrome extension to keep track of courses while
              browsing your university catalog.
            </p>
          </header>
          <ExtensionForm />
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
