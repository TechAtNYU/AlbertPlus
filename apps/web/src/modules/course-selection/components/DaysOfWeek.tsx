import { useId } from "react";

import { Checkbox } from "@/components/ui/checkbox";

const dayOptions = [
  { value: "monday", label: "Monday", defaultChecked: true, disabled: false },
  { value: "tuesday", label: "Tuesday", defaultChecked: true, disabled: false },
  {
    value: "wednesday",
    label: "Wednesday",
    defaultChecked: true,
    disabled: false,
  },
  {
    value: "thursday",
    label: "Thursday",
    defaultChecked: true,
    disabled: false,
  },
  { value: "friday", label: "Friday", defaultChecked: true, disabled: false },
  {
    value: "saturday",
    label: "Saturday",
    defaultChecked: false,
    disabled: false,
  },
  { value: "sunday", label: "Sunday", defaultChecked: false, disabled: false },
] as const;

export type DayOptionValue = (typeof dayOptions)[number]["value"];

export const DEFAULT_SELECTED_DAYS = dayOptions
  .filter((option) => option.defaultChecked)
  .map((option) => option.value);

interface DaysOfWeekProps {
  selectedDays: DayOptionValue[];
  onSelectedDaysChange: (days: DayOptionValue[]) => void;
}

export default function DaysOfWeek({
  selectedDays,
  onSelectedDaysChange,
}: DaysOfWeekProps) {
  const id = useId();
  const dayOrder = dayOptions.map((option) => option.value);
  const selectedDaysSet = new Set(selectedDays);

  const handleCheckedChange = (
    value: DayOptionValue,
    checked: boolean | "indeterminate",
  ) => {
    if (checked === "indeterminate") {
      return;
    }

    const nextSelection = new Set(selectedDaysSet);
    if (checked) {
      nextSelection.add(value);
    } else {
      nextSelection.delete(value);
    }

    const orderedSelection = dayOrder.filter((day) => nextSelection.has(day));
    onSelectedDaysChange(orderedSelection);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm leading-none font-medium text-foreground">
        Days of the week
      </legend>
      <div className="flex gap-1.5">
        {dayOptions.map((item) => (
          <label
            key={`${id}-${item.value}`}
            className="relative flex size-9 cursor-pointer flex-col items-center justify-center gap-3 rounded-full border border-input text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground"
          >
            {/* Biome: A form label must be associated with an input. */}
            <input type="hidden" />

            <Checkbox
              id={`${id}-${item.value}`}
              value={item.value}
              className="sr-only after:absolute after:inset-0"
              checked={selectedDaysSet.has(item.value)}
              onCheckedChange={(checked) =>
                handleCheckedChange(item.value, checked)
              }
              disabled={item.disabled}
            />
            <span aria-hidden="true" className="text-sm font-medium">
              {item.label[0]}
            </span>
            <span className="sr-only">{item.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
