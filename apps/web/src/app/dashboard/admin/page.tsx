"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import type { Doc } from "@albert-plus/server/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { BookOpen, GraduationCap, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfigDialog } from "./components/config-dialog";
import { ConfigTable } from "./components/config-table";

export default function AdminPage() {
  const { user } = useUser();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.is_admin;

  const configs = useQuery(
    api.appConfigs.getAllAppConfigs,
    isAuthenticated && isAdmin ? {} : "skip",
  );
  const setConfig = useMutation(api.appConfigs.setAppConfig);
  const removeConfig = useMutation(api.appConfigs.removeAppConfig);
  const triggerMajorsScraping = useAction(api.scraper.triggerMajorsScraping);
  const triggerCoursesScraping = useAction(api.scraper.triggerCoursesScraping);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingValues, setEditingValues] = useState<
    Doc<"appConfigs"> | undefined
  >(undefined);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState<
    Doc<"appConfigs"> | undefined
  >(undefined);

  const [isTriggeringMajors, setIsTriggeringMajors] = useState(false);
  const [isTriggeringCourses, setIsTriggeringCourses] = useState(false);

  if (isAuthenticated && !isAdmin) {
    router.push("/dashboard");
    return null;
  }

  if (isLoading || !isAuthenticated || !configs) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  async function onSaveConfig(key: string, value: string) {
    await setConfig({ key, value });
  }

  const handleAdd = () => {
    setMode("add");
    setEditingValues(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (config: Doc<"appConfigs">) => {
    setMode("edit");
    setEditingValues(config);
    setIsDialogOpen(true);
  };

  const handleDelete = (config: Doc<"appConfigs">) => {
    setDeletingConfig(config);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingConfig) {
      await removeConfig({ key: deletingConfig.key });
      setIsDeleteDialogOpen(false);
      setDeletingConfig(undefined);
    }
  };

  const handleTriggerMajors = async () => {
    setIsTriggeringMajors(true);
    try {
      const result = await triggerMajorsScraping({});
      toast.success("Majors scraping triggered successfully", {
        description: `Job ID: ${result.jobId}`,
      });
    } catch (error) {
      toast.error("Failed to trigger majors scraping", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTriggeringMajors(false);
    }
  };

  const handleTriggerCourses = async () => {
    setIsTriggeringCourses(true);
    try {
      const result = await triggerCoursesScraping({});
      toast.success("Courses scraping triggered successfully", {
        description: `Job ID: ${result.jobId}`,
      });
    } catch (error) {
      toast.error("Failed to trigger courses scraping", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTriggeringCourses(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Scraper Controls</h2>
        <div className="flex gap-3">
          <Button
            onClick={handleTriggerMajors}
            disabled={isTriggeringMajors}
            size="sm"
            variant="outline"
          >
            {isTriggeringMajors ? (
              <Spinner className="size-4" />
            ) : (
              <GraduationCap className="size-4" />
            )}
            Trigger Majors Scraping
          </Button>
          <Button
            onClick={handleTriggerCourses}
            disabled={isTriggeringCourses}
            size="sm"
            variant="outline"
          >
            {isTriggeringCourses ? (
              <Spinner className="size-4" />
            ) : (
              <BookOpen className="size-4" />
            )}
            Trigger Courses Scraping
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">App Configuration</h2>
        <Button onClick={handleAdd} size="sm">
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <ConfigTable data={configs} onEdit={handleEdit} onDelete={handleDelete} />

      <ConfigDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingValues(undefined);
          }
        }}
        mode={mode}
        initial={editingValues}
        onSubmit={onSaveConfig}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletingConfig(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the configuration key{" "}
              <span className="font-mono font-semibold">
                {deletingConfig?.key}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
