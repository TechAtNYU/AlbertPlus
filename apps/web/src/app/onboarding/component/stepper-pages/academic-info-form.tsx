import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MultipleSelector from "@/components/ui/multiselect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import z from "zod";

const schools = [
  "College of Arts & Science",
  "College of Dentistry",
  "Gallatin School of Individualized Study",
  "Leonard N. Stern School of Business",
  "Liberal Studies",
  "Rory Meyers College of Nursing",
  "Steinhardt School of Culture, Education, and Human Development",
  "Silver School of Social Work",
  "School of Professional Studies",
  "Tandon School of Engineering",
  "Tisch School of the Arts",
] as const;

const programOptions: string[] = [];

export type AcademicInfoFormValues = z.infer<typeof academicInfoSchema>;

export const academicInfoSchema = z
  .object({
    school: z.enum(schools),
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
  const { control, setValue, watch } = useFormContext<AcademicInfoFormValues>();

  const programsValue = watch("programs") || [];

  return (
    <div className="space-y-6 text-start">
      <FormField
        control={control}
        name="school"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">
              What school or college do you go to?
            </FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your school or college" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {schools.map((school) => (
                    <SelectItem key={school} value={school}>
                      {school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Programs Selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Please select your program (major and minor)
        </p>
        <MultipleSelector
          value={programsValue.map((p) => ({ value: p, label: p }))}
          onChange={(options) => {
            const values = options.map((opt) => opt.value);
            console.log("Programs selected:", values);
            setValue("programs", values);
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
      </div>

      {/* Starting Date */}
      <div className="space-y-2">
        <FormLabel className="text-sm font-medium text-gray-700">
          When did you start your program?
        </FormLabel>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="startingDate.year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2000"
                    max="2100"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(
                        value === "" ? undefined : Number.parseInt(value, 10),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="startingDate.term"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Term</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Expected Graduation Date */}
      <FormField
        control={control}
        name="expectedGraduationDate"
        render={({ fieldState }) => (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              When do you expect to graduate?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="expectedGraduationDate.year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2000"
                        max="2100"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === ""
                              ? undefined
                              : Number.parseInt(value, 10),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="expectedGraduationDate.term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spring">Spring</SelectItem>
                          <SelectItem value="fall">Fall</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {fieldState.error && (
              <p className="text-sm text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};
