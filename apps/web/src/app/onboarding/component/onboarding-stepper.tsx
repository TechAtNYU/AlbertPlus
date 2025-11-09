"use client";

import { Button } from "@/components/ui/button";
import { defineStepper } from "@/components/ui/stepper";
import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import {
  useMutation,
  usePaginatedQuery,
  useQuery,
  type PaginationStatus,
} from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { z } from "zod";
import { AcademicInfoForm } from "./stepper-pages/academic-info-form";
import {
  academicInfoSchema,
  type AcademicInfoFormValues,
} from "./academic-info-schema";
import { ExtensionForm, extensionSchema } from "./stepper-pages/extention-form";
import {
  reportSchema,
  ReportUploadForm,
} from "./stepper-pages/report-upload-form";
import { useForm } from "@tanstack/react-form";
import { FunctionArgs } from "convex/server";

function CompleteComponent() {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold">Onboarding Complete!</h2>
      <p className="text-muted-foreground">
        Welcome to CourseHelper! You can now access your dashboard and start
        managing your courses.
      </p>
    </div>
  );
}

const { Stepper, useStepper } = defineStepper(
  {
    id: "academic-info",
    title: "Academic Information",
    schema: academicInfoSchema,
    Component: AcademicInfoForm,
  },
  {
    id: "report",
    title: "Degree Report",
    schema: reportSchema,
    Component: ReportUploadForm,
  },
  {
    id: "extension",
    title: "Chrome Extension",
    schema: extensionSchema,
    Component: ExtensionForm,
  },
  {
    id: "complete",
    title: "Complete",
    schema: z.object({}),
    Component: CompleteComponent,
  },
);

export function OnboardingStepper() {
  const [programsQuery, setProgramsQuery] = React.useState<string | undefined>(
    undefined,
  );
  const {
    results: programs,
    status: programsStatus,
    loadMore: programsLoadMore,
  } = usePaginatedQuery(
    api.programs.getPrograms,
    { query: programsQuery },
    { initialNumItems: 20 },
  );
  const schools = useQuery(api.schools.getSchools);

  return (
    <Stepper.Provider>
      <OnboardingStepperContent
        schools={schools}
        programs={programs}
        setProgramsQuery={setProgramsQuery}
        programsStatus={programsStatus}
        programsLoadMore={programsLoadMore}
      />
    </Stepper.Provider>
  );
}

interface OnboardingStepperContentProps {
  schools: Doc<"schools">[] | undefined;
  programs: Doc<"programs">[];
  setProgramsQuery: React.Dispatch<React.SetStateAction<string | undefined>>;
  programsStatus: PaginationStatus;
  programsLoadMore: (numItems: number) => void;
}

const OnboardingStepperContent = ({
  schools,
  programs,
  setProgramsQuery,
  programsStatus,
  programsLoadMore,
}: OnboardingStepperContentProps) => {
  const methods = useStepper();

  const { user } = useUser();
  const router = useRouter();
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);

  const form = useForm({
    defaultValues: {
      // student data
      school: "",
      programs: [] as string[],
      startingDate: undefined as Doc<"students">["startingDate"] | undefined,
      expectedGraduationDate: undefined as
        | Doc<"students">["expectedGraduationDate"]
        | undefined,
      // user courses
      userCourses: [] as FunctionArgs<
        typeof api.userCourses.importUserCourses
      >["courses"],
    },
    onSubmit: async ({ value }) => {
      // TODO: handle save to convex database
      console.log(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <Stepper.Navigation>
        {methods.all.map((step) => (
          <Stepper.Step
            key={step.id}
            of={step.id}
            type={step.id === methods.current.id ? "submit" : "button"}
            onClick={async () => {
              const valid = await form.trigger();
              if (!valid) return;
              methods.goTo(step.id);
            }}
          >
            <Stepper.Title>{step.title}</Stepper.Title>
          </Stepper.Step>
        ))}
      </Stepper.Navigation>
      {methods.switch({
        "academic-info": ({ Component }) => <Component />,
        report: ({ Component }) => <Component />,
        extension: ({ Component }) => <Component />,
        complete: ({ Component }) => <Component />,
      })}
      <Stepper.Controls>
        <Button
          type="button"
          variant="secondary"
          onClick={methods.prev}
          disabled={methods.isFirst}
        >
          Previous
        </Button>
        <Button
          type="submit"
          onClick={async (e) => {
            e.preventDefault();

            const valid = await form.trigger();
            if (!valid) return;

            if (methods.isLast) {
              // Complete onboarding and go to dashboard
              try {
                // Get programs data from the first step
                const academicInfo = allStepsData["academic-info"] as
                  | AcademicInfoFormValues
                  | undefined;
                console.log("Collected academic info:", academicInfo);

                if (!academicInfo) {
                  console.error("Academic info not found");
                  return;
                }

                // TODO: Convert program names to program IDs
                // For now, we'll use an empty array until we implement program lookup
                // The academic info data contains the program names selected by the user
                // We need to look up these programs in the database and get their IDs

                // Save student data to Convex
                // Note: This requires program IDs, not names.
                // We're using the actual dates collected from the form
                await upsertStudent({
                  // TODO: Map program names to program IDs
                  // For now using empty array - will be populated once we add program lookup
                  programs: [],
                  startingDate: {
                    year: academicInfo.startingDate.year,
                    term: academicInfo.startingDate.term,
                  },
                  expectedGraduationDate: {
                    year: academicInfo.expectedGraduationDate.year,
                    term: academicInfo.expectedGraduationDate.term,
                  },
                  isOnboarded: true,
                });

                // Update user metadata to mark onboarding as complete
                await user?.update({
                  unsafeMetadata: {
                    ...user.unsafeMetadata,
                    onboarding_completed: true,
                  },
                });

                // Redirect to dashboard
                router.push("/dashboard");
              } catch (error) {
                console.error("Error completing onboarding:", error);
              }
            } else {
              // For non-last steps, just move to the next step
              methods.next();
            }
          }}
        >
          {methods.isLast ? "Complete Onboarding" : "Next"}
        </Button>
      </Stepper.Controls>
    </form>
  );
};
