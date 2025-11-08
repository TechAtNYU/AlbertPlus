import DegreeProgreeUpload from "@/modules/report-parsing/components/degree-progress-upload";
import z from "zod";

export const reportSchema = z.object({
  reportUploaded: z
    .boolean()
    .refine((val) => val === true, "Please upload your degree progress report"),
  reportFile: z.any().optional(), // File instance
  reportFileName: z.string().optional(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportUploadForm() {
  return (
    <div className="space-y-4 text-start">
      <div className="space-y-4">
        <div className="rounded-lg border p-4 bg-gray-50">
          <h3 className="font-semibold text-black mb-2">
            Upload Your Degree Progress Report
          </h3>
          <p className="text-sm text-black mb-4">
            Upload your degree progress report (PDF) so we can help you track
            your academic progress and suggest courses.
          </p>

          <div className="space-y-4">
            <DegreeProgreeUpload maxSizeMB={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
