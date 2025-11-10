"use client";

import type { Doc, Id } from "@albert-plus/server/convex/_generated/dataModel";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type School = Doc<"schools">;

type SchoolComboboxProps = {
  schools: School[] | undefined;
  value: Id<"schools"> | undefined;
  onValueChange: (value: Id<"schools">) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

export function SchoolCombobox({
  schools,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select your school or college",
  id: providedId,
}: SchoolComboboxProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const [open, setOpen] = useState(false);

  const selectedSchool = schools?.find((s) => s._id === value);

  const formatSchoolLabel = (school: School) => {
    return `${school.name} - ${school.level.charAt(0).toUpperCase() + school.level.slice(1)}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || schools === undefined}
          className="w-full justify-between border-input bg-background px-3 font-normal outline-offset-0 outline-none hover:bg-background focus-visible:outline-[3px]"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {selectedSchool ? formatSchoolLabel(selectedSchool) : placeholder}
          </span>
          <ChevronDownIcon
            size={16}
            className="shrink-0 text-muted-foreground/80"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search school..." />
          <CommandList>
            <CommandEmpty>
              {schools === undefined
                ? "Loading schools..."
                : "No school found."}
            </CommandEmpty>
            <CommandGroup>
              {schools?.map((school) => (
                <CommandItem
                  key={school._id}
                  value={`${school.name} ${school.level}`}
                  onSelect={() => {
                    onValueChange(school._id);
                    setOpen(false);
                  }}
                >
                  {formatSchoolLabel(school)}
                  {value === school._id && (
                    <CheckIcon size={16} className="ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
