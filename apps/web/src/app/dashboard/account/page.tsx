"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {EditProfilePopup} from "./components/editProfile";
import { Shield, Key, Trash2, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useForm } from "@tanstack/react-form";
import { Doc, Id } from "@albert-plus/server/convex/_generated/dataModel";
import { FunctionArgs } from "convex/server";
import { toast } from "sonner";
import React from "react";
import { useRouter } from "next/router";
import { getTermAfterSemesters, Term } from "@/utils/term";
import z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  term: z.union([
    z.literal("spring"),
    z.literal("fall"),
    z.literal("j-term"),
    z.literal("summer"),
  ]),
});
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  Field as UIField,
} from "@/components/ui/field";
import { SchoolCombobox } from "@/app/onboarding/component/school-combobox";
import MultipleSelector from "@/app/onboarding/component/multiselect";

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


export default function ProfilePage() {
 
  const upsert = useMutation(api.students.upsertCurrentStudent);

  // const router = useRouter();
    const { isAuthenticated } = useConvexAuth();
    const [isFileLoaded, setIsFileLoaded] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState<1 | 2>(1);
  
     const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

    const { user } = useUser();
  
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
          toast.success("Successfully updated profile.");
          // router.push("/dashboard");
  
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
      const programIds: Id<"programs">[] = (student.programs ?? []).map(
        (p: any) =>
          typeof p === "string"
            ? (p as Id<"programs">)
            : (p?._id as Id<"programs">),
      );
  
      form.setFieldValue("programs", programIds);
  
     
    }, [student]);
  
  

  return (
    <div>
      <Tabs defaultValue="personal" className="space-y-6">
      {/* <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList> */}
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
              <h1 className="text-2xl font-bold">{user?.fullName || "Unknown User"}</h1>
              
            </div>
            {student && (
                <p className="text-muted-foreground">
                  {student.school?.level
                    ? student.school.level.charAt(0).toUpperCase() + student.school.level.slice(1).toLowerCase() + " Student"
                    : "Student"}
                </p>
              )}
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {user?.primaryEmailAddress?.emailAddress || ""}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                New York University
              </div>
              {/* <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                Joined March 2023
              </div> */}
            </div>
          </div>
          {/* <Button variant="default">Edit Profile</Button> */}
        </div>
      </CardContent>
    </Card>
      
      {student && (
      
      <TabsContent value="personal" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>View and update your academic information here.</CardDescription>
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
                <form.Field name="school">
                    {(field) => {
                      return (
                        <UIField>
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
                {/* <p className="text-gray-700 text-sm">{student.school
                ? `${student.school.name} (${
                    student.school.level
                      ? student.school.level.charAt(0).toUpperCase() + student.school.level.slice(1).toLowerCase()
                      : ""
                  })`
                : "N/A"}</p> */}
                {/* <Input id="firstName" defaultValue="John" /> */}
              </div>
              <div className="space-y-2">
                <Label>Programs</Label>
                {/* <p className="text-gray-700 text-sm">{student.programs?.length > 0
                ? student.programs.map((p) => p.name).join(", ")
                : "None"}</p> */}
                <form.Field name="programs">
                  {(field) => {
                    const selected = (field.state.value ?? []).map((p) => ({
                      value: p,
                      label: programOptions.find((val) => val.value === p)
                        ?.label as string,
                    }));
                    return (
                      <UIField>
                        {/* <FieldLabel htmlFor={field.name}>
                          What are your major(s) and minor(s)?
                        </FieldLabel> */}
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

                {/* <Input id="lastName" defaultValue="Doe" /> */}
              </div>
              <div className="space-y-2">
                <Label>Enrollment Start Date</Label>
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
              
                {/* <p className="text-gray-700 text-sm">{student.startingDate
                ? `${student.startingDate.term.charAt(0).toUpperCase()}${student.startingDate.term.slice(1)} ${student.startingDate.year}`
                : "N/A"}</p> */}
                {/* <Input id="email" type="email" defaultValue="john.doe@example.com" /> */}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Expected Graduation Date</Label>
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
                {/* <p className="text-gray-700 text-sm">{student.expectedGraduationDate
                ? `${student.expectedGraduationDate.term.charAt(0).toUpperCase()}${student.expectedGraduationDate.term.slice(1)} ${student.expectedGraduationDate.year}`
                : "N/A"}</p> */}
                {/* <Input id="phone" defaultValue="+1 (555) 123-4567" /> */}
              </div>
              <Button
                type="submit"
                disabled={form.state.isSubmitting}
                className="w-auto max-w-fit"
              >
                {form.state.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              {/* <EditProfilePopup/> */}
            </div>
          </CardContent></form>
        </Card>
      </TabsContent>)};

    </Tabs>
    
    </div>
  );
}
