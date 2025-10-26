import FileUploadButton from "@/modules/report-parsing/components/file-upload-button";
import { useFormContext } from "react-hook-form";
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
  const { setValue, watch } = useFormContext<ReportFormValues>();

  const handleFileUploaded = (file: File | null) => {
    setValue("reportUploaded", file !== null);

    if (file) {
      setValue("reportFile", file);
      setValue("reportFileName", file.name);
      console.log("Degree report uploaded:", file.name);
    } else {
      setValue("reportFile", undefined);
      setValue("reportFileName", undefined);
      console.log("Degree report removed");
    }
  };

  const isUploaded = watch("reportUploaded");
  const uploadedFileName = watch("reportFileName");
  const reportFile = watch("reportFile");

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
            <FileUploadButton
              maxSizeMB={20}
              onFileUploaded={handleFileUploaded}
              initialFile={reportFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
