import {
  type AppConfigKey,
  appConfigOptions,
} from "@albert-plus/server/convex/schemas/appConfigs";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

type ConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: {
    key: z.infer<typeof AppConfigKey>;
    value: string;
  };
  onSubmit: (key: string, value: string) => Promise<void>;
};

export function ConfigDialog({
  open,
  onOpenChange,
  mode,
  initial = {
    key: "",
    value: "",
  },
  onSubmit,
}: ConfigDialogProps) {
  const form = useForm({
    defaultValues: {
      key: initial.key,
      value: initial.value,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.key, value.value);
      onOpenChange(false);
      form.reset();
    },
    validators: {
      onChange: z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      }),
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Configuration" : "Edit Configuration"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" && `Update the value for "${initial.key}".`}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4 py-4">
            <form.Field name="key">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Key <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    placeholder="key"
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={mode === "edit"}
                  />
                  {mode === "add" && (
                    <p className="text-xs text-muted-foreground">
                      Available options: {appConfigOptions.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="value">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Value <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="value"
                  />
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => {
                if (isSubmitting) {
                  return (
                    <Button type="submit" disabled>
                      <Spinner />
                      {mode === "add" ? "Adding..." : "Saving..."}
                    </Button>
                  );
                }
                return (
                  <Button type="submit" disabled={!canSubmit}>
                    Save
                  </Button>
                );
              }}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
