import { CalendarIcon, ListIcon } from "lucide-react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SelectorProps {
  value: "selector" | "calendar";
  onValueChange: (value: "selector" | "calendar") => void;
}

export default function Selector({ value, onValueChange }: SelectorProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === "selector" || newValue === "calendar") {
      onValueChange(newValue);
    }
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange} className="w-full">
      <ScrollArea>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="selector" className="flex items-center gap-1.5">
            <ListIcon className="opacity-60" size={16} aria-hidden="true" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5">
            <CalendarIcon className="opacity-60" size={16} aria-hidden="true" />
            Schedule
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}
