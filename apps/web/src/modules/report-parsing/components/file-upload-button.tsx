"use client";

import { AlertCircleIcon, FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  extractCourseHistory,
  isDegreeProgressReport,
} from "../utils/extract-pdf-text";
import { parseCourseHistory } from "../utils/parse-course-history";

type FileUploadButtonProps = {
  maxSizeMB?: number;
};

export default function FileUploadButton({
  maxSizeMB = 20,
}: FileUploadButtonProps) {
  const maxSize = maxSizeMB * 1024 * 1024;
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      setErrors,
    },
  ] = useFileUpload({
    accept: "application/pdf,.pdf",
    maxSize,
    onFilesAdded: async (addedFiles) => {
      const fileData = addedFiles[0];
      if (!fileData) return;

      const file = fileData.file;
      if (!(file instanceof File)) return;

      // Verify it's a Degree Progress Report
      try {
        const ok = await isDegreeProgressReport(file);
        if (!ok) {
          setErrors(["This PDF doesn't look like a Degree Progress Report."]);
          removeFile(fileData.id);
          return;
        }
      } catch (err) {
        console.error("Error verifying PDF:", err);
        setErrors(["Could not verify the PDF file."]);
        removeFile(fileData.id);
        return;
      }

      // Extract and parse course history
      try {
        const historyText = await extractCourseHistory(file);
        const result = parseCourseHistory(historyText);
        console.log("Parsed courses:", result);
      } catch (err) {
        console.error("Error parsing PDF:", err);
        setErrors(["Error parsing course history from PDF."]);
      }
    },
  });

  const fileName = files[0]?.file.name || null;
  const hasFile = files.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* Drop area */}
        <button
          type="button"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="w-full relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-input p-4 transition-colors has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload PDF file"
          />
          {hasFile ? (
            <div className="flex w-full flex-col items-center justify-center gap-3 p-4">
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-background"
                aria-hidden="true"
              >
                <FileTextIcon className="size-8 opacity-60" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">PDF Selected</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                aria-hidden="true"
              >
                <FileTextIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">Drop your PDF here</p>
              <p className="text-xs text-muted-foreground">
                Degree Progress Report
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={openFileDialog}
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Choose PDF File
              </Button>
            </div>
          )}
        </button>

        {hasFile && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove file"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}
