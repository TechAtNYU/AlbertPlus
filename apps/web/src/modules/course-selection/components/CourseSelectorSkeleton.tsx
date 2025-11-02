"use client";
import { Skeleton } from "@/components/ui/skeleton";

const CourseSelectorSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 w-full md:max-w-[350px] h-full">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: they will not be accessed
            key={i}
            className="p-4 border rounded-lg space-y-3 bg-card/30 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseSelectorSkeleton;
