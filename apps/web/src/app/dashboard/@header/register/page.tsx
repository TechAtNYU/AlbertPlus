"use client";

import { useNextTerm, useNextYear } from "@/components/AppConfigProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTermTitle } from "@/utils/format-term";
import { AppHeader } from "../../components/app-header";

export default function ScheduleHeader() {
  const term = useNextTerm();
  const year = useNextYear();

  const title = formatTermTitle(term, year);

  return (
    <AppHeader
      title="Register"
      center={
        title ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border shadow-sm">
            <span className="text-sm font-semibold">{title}</span>
          </div>
        ) : (
          <Skeleton className="h-7 w-28 rounded-full" />
        )
      }
    />
  );
}
