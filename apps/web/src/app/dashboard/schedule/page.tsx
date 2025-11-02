"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useCurrentTerm, useCurrentYear } from "@/components/AppConfigProvider";
import {
  getUserClassesByTerm,
  ScheduleCalendar,
} from "@/modules/schedule-calendar/schedule-calendar";

const SchedulePage = () => {
  const { isAuthenticated } = useConvexAuth();
  const currentYear = useCurrentYear();
  const currentTerm = useCurrentTerm();

  // const [mobileView, setMobileView] = useState<"selector" | "calendar">(
  //   "selector",
  // );

  const allClasses = useQuery(
    api.userCourseOfferings.getUserCourseOfferings,
    isAuthenticated ? {} : "skip",
  );

  const classes = getUserClassesByTerm(allClasses, currentYear, currentTerm);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-(--spacing(16))-(--spacing(12)))] w-full">
      {/* Mobile toggle buttons */}
      {/* <div className="md:hidden shrink-0 p-2"> */}
      {/*   <Selector value={mobileView} onValueChange={setMobileView} /> */}
      {/* </div> */}

      {/* Mobile view */}
      {/* <div className="md:hidden flex-1 min-h-0"> */}
      {/*   {mobileView === "selector" ? ( */}
      {/*     <CourseSelector */}
      {/*       courseOfferingsWithCourses={displayedResults} */}
      {/*       onHover={setHoveredCourse} */}
      {/*       onSearchChange={setSearchValue} */}
      {/*       searchQuery={searchValue} */}
      {/*       loadMore={loadMore} */}
      {/*       status={status} */}
      {/*       isSearching={isSearching} */}
      {/*     /> */}
      {/*   ) : ( */}
      {/*     <div className="h-full"> */}
      {/*       <ScheduleCalendar classes={classes} hoveredCourse={hoveredCourse} /> */}
      {/*     </div> */}
      {/*   )} */}
      {/* </div> */}

      {/* Desktop view */}
      <div className="hidden md:flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <div className="sticky top-0">
            <ScheduleCalendar classes={classes} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
