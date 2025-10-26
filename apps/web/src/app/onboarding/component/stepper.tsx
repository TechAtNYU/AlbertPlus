"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { defineStepper } from "@/components/ui/stepper";
import { useUser } from "@clerk/nextjs";
import { api } from "@dev-team-fall-25/server/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AcademicInfoForm,
  academicInfoSchema,
} from "./stepper-pages/academic-info-form";

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

// TODO: after the scraper is impelmented, get programs from the backend instead
const programs: FunctionReturnType<typeof api.programs.getPrograms> = [
  "Computer Science",
  "Mathematics",
  "Statistics",
  "Data Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Business Administration",
  "Finance",
  "Economics",
  "Psychology",
  "English",
  "History",
  "Political Science",
  "Art",
  "Music",
  "Other",
];

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

export function StepperWithForm() {
  return (
    <Stepper.Provider>
      <FormStepperComponent />
    </Stepper.Provider>
  );
}

const FormStepperComponent = () => {
  const methods = useStepper();

  const form = useForm({
    mode: "onTouched",
    resolver: zodResolver(methods.current.schema),
  });

  const { user } = useUser();
  const router = useRouter();
  const upsertStudent = useMutation(api.students.upsertCurrentStudent);

  // Track data across all steps
  const [allStepsData, setAllStepsData] = React.useState<
    Record<string, unknown>
  >({});

  const onSubmit = async (values: z.infer<typeof methods.current.schema>) => {
    // Store this step's data
    setAllStepsData((prev) => ({
      ...prev,
      [methods.current.id]: values,
    }));

    if (methods.current.id !== "complete") {
      console.log(
        `Form values for step ${methods.current.id}: ${JSON.stringify(values)}`,
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              // Submit the current form to save this step's data
              await form.handleSubmit(onSubmit)();

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
                await methods.next();
              }
            }}
          >
            {methods.isLast ? "Complete Onboarding" : "Next"}
          </Button>
        </Stepper.Controls>
      </form>
    </Form>
  );
};
