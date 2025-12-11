import type { LucideIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tab<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface ViewSelectorProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  tabs: Tab<T>[];
}

export default function ViewSelector<T extends string>({
  value,
  onValueChange,
  tabs,
}: ViewSelectorProps<T>) {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue as T);
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange} className="w-full">
      <ScrollArea>
        <TabsList className="w-full grid grid-cols-2">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5"
            >
              <tab.icon className="opacity-60" size={16} aria-hidden="true" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}
