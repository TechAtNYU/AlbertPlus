"use client";

import { CheckIcon, MinusIcon } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useId } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const items = [
  { value: "light", label: "Light", image: "/ui-light.png" },
  { value: "dark", label: "Dark", image: "/ui-dark.png" },
  { value: "system", label: "System", image: "/ui-system.png" },
];

export default function ThemeSelector() {
  const id = useId();
  const { theme, setTheme } = useTheme();

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm leading-none font-medium text-foreground">
        Choose a theme
      </legend>
      <RadioGroup className="flex gap-3" value={theme} onValueChange={setTheme}>
        {items.map((item) => (
          <label key={`${id}-${item.value}`} htmlFor={`${id}-${item.value}`}>
            <RadioGroupItem
              id={`${id}-${item.value}`}
              value={item.value}
              className="peer sr-only after:absolute after:inset-0"
            />
            <Image
              src={item.image}
              alt={item.label}
              width={120}
              height={95}
              className="relative cursor-pointer overflow-hidden rounded-md border border-input shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50 peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent"
            />
            <span className="group mt-2 flex items-center gap-1 peer-data-[state=unchecked]:text-muted-foreground/70">
              <CheckIcon
                size={16}
                className="group-peer-data-[state=unchecked]:hidden"
                aria-hidden="true"
              />
              <MinusIcon
                size={16}
                className="group-peer-data-[state=checked]:hidden"
                aria-hidden="true"
              />
              <span className="text-xs font-medium">{item.label}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
