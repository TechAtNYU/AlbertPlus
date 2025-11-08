"use client";

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
import {
  Controller,
  type FieldError as RHFFieldError,
  useFormContext,
} from "react-hook-form";
import z from "zod";
import { api } from "@albert-plus/server/convex/_generated/api";
import { useQuery } from "convex/react";

const programOptions: string[] = [];

export type AcademicInfoFormValues = z.infer<typeof academicInfoSchema>;

export const academicInfoSchema = z
  .object({
    school: z.string().min(1, "Please select your school or college"),
    programs: z.array(z.string()).min(1, "At least one program is required"),
    startingDate: z.object({
      year: z.number().min(2000).max(2100),
      term: z.enum(["spring", "fall"]),
    }),
    expectedGraduationDate: z.object({
      year: z.number().min(2000).max(2100),
      term: z.enum(["spring", "fall"]),
    }),
  })
  .refine(
    (data) => {
      const startValue =
        data.startingDate.year + (data.startingDate.term === "fall" ? 1 : 0.5);
      const gradValue =
        data.expectedGraduationDate.year +
        (data.expectedGraduationDate.term === "fall" ? 1 : 0.5);
      return gradValue > startValue;
    },
    {
      message: "Expected graduation date must be after the starting date",
      path: ["expectedGraduationDate"],
    },
  );

export const AcademicInfoForm = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<AcademicInfoFormValues>();
  const schools = useQuery(api.schools.getSchools);
  const isLoadingSchools = schools === undefined;

  const toErrorArray = (error?: RHFFieldError) =>
    error ? [{ message: error.message }] : undefined;

  return (
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
                        value === "" ? undefined : Number.parseInt(value, 10),
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                        value === "" ? undefined : Number.parseInt(value, 10),
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
          errors={toErrorArray(errors.expectedGraduationDate as RHFFieldError)}
        />
      </FieldGroup>
    </FieldSet>
  );
};
