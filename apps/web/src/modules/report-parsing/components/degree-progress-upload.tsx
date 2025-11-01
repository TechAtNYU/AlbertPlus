"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useMutation } from "convex/react";
import { FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { UserCourse } from "../types";
import {
  extractCourseHistory,
  isDegreeProgressReport,
} from "../utils/extract-pdf-text";
import { parseCourseHistory } from "../utils/parse-course-history";
import { transformToUserCourses } from "../utils/transform-to-user-courses";
import ConfirmModal from "./confirm-modal";

type FileUploadButtonProps = {
  maxSizeMB?: number;
};

export default function DegreeProgreeUpload({
  maxSizeMB = 20,
}: FileUploadButtonProps) {
  const maxSize = maxSizeMB * 1024 * 1024;
  const [parsedCourses, setParsedCourses] = useState<UserCourse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const batchImport = useMutation(api.userCourses.importUserCourses);
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
          toast.error("This PDF doesn't look like a Degree Progress Report.");
          removeFile(fileData.id);
          return;
        }
      } catch (err) {
        console.error("Error verifying PDF:", err);
        toast.error("Could not verify the PDF file.");
        removeFile(fileData.id);
        return;
      }

      // Extract and parse course history
      try {
        const historyText = await extractCourseHistory(file);
        const courses = parseCourseHistory(historyText);
        const userCourses = transformToUserCourses(courses);

        // Store parsed courses and open confirmation modal
        setParsedCourses(userCourses);
        setIsModalOpen(true);
      } catch (err) {
        console.error("Error parsing PDF:", err);
        toast.error("Error parsing course history from PDF.");
      }
    },
  });

  const fileName = files[0]?.file.name || null;
  const hasFile = files.length > 0;

  const handleConfirm = async () => {
    setIsImporting(true);
    try {
      const result = await batchImport({ courses: parsedCourses });

      const messages = [];
      if (result.inserted > 0) {
        messages.push(
          `${result.inserted} new course${result.inserted !== 1 ? "s" : ""} imported`,
        );
      }
      if (result.updated > 0) {
        messages.push(
          `${result.updated} course${result.updated !== 1 ? "s" : ""} updated with grades`,
        );
      }
      if (result.duplicates > 0) {
        messages.push(
          `${result.duplicates} duplicate${result.duplicates !== 1 ? "s" : ""} skipped`,
        );
      }

      toast.success(`Import complete: ${messages.join(", ")}`);

      setIsModalOpen(false);

      // wait for modal close before clearing state
      // otherwise the modal will flicker with empty data
      setTimeout(() => {
        setParsedCourses([]);
        if (files[0]) {
          removeFile(files[0].id);
        }
      }, 300);
    } catch (err) {
      console.error("Error importing courses:", err);
      toast.error("An error occurred while importing courses");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setParsedCourses([]);
    // Remove the uploaded file
    if (files[0]) {
      removeFile(files[0].id);
    }
  };

  useEffect(() => {
    errors.forEach((error) => {
      toast.error(error);
    });
  }, [errors]);

  return (
    <>
      <ConfirmModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        courses={parsedCourses}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isImporting={isImporting}
      />
      <div className="flex flex-col gap-2">
        <div className="relative">
          {/* biome-ignore lint/a11y/useSemanticElements: change div to button will cause hydration error */}
          <div
            role="button"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            tabIndex={0}
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
          </div>

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
      </div>
    </>
  );
}
