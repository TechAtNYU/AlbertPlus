import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useAuth } from "@clerk/chrome-extension";
import { BookOpen, GraduationCap, Library, Loader2 } from "lucide-react";
import ConvexWithClerkProvider from "~components/ConvexWithClerkProvider";
import SignIn from "~components/SignIn";
import { api } from "../../../packages/server/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~components/ui/card";
import { Separator } from "~components/ui/separator";
import { Skeleton } from "~components/ui/skeleton";

import "~style.css";

function CourseDisplay() {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [courseSearchSaved, setCourseSearchSaved] = useState<any[]>([]);
  const { getToken } = useAuth();

  // Fetch user courses from Convex
  const userCoursesFromConvex = useQuery(api.userCourses.getUserCourses);
  // Fetch user course offerings (saved courses) from Convex
  const userCourseOfferingsFromConvex = useQuery(
    api.userCourseOfferings.getUserCourseOfferings
  );

  // Send auth token to background script
  useEffect(() => {
    const updateBackgroundAuth = async () => {
      try {
        const token = await getToken({ template: "convex" });
        chrome.runtime.sendMessage({
          type: "UPDATE_AUTH_TOKEN",
          token: token,
        });
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
    };

    updateBackgroundAuth();
    // Update token periodically (every 5 minutes)
    const interval = setInterval(updateBackgroundAuth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [getToken]);

  // Load initial data from local storage (instant display)
  useEffect(() => {
    chrome.storage.local.get(
      ["enrolledCourses", "completedCourses", "courseSearchSaved"],
      (result) => {
        const enrolled = result.enrolledCourses || [];
        const completed = result.completedCourses || [];
        const courseSearchSaved = result.courseSearchSaved || [];
        setEnrolledCourses(enrolled);
        setCompletedCourses(completed);
        setCourseSearchSaved(courseSearchSaved);
        console.log(
          "Loaded from local storage - Enrolled:",
          enrolled.length,
          "Completed:",
          completed.length
        );
      }
    );
  }, []);

  // Sync with Convex data when it loads
  useEffect(() => {
    if (userCoursesFromConvex) {
      console.log(
        "Syncing with Convex backend - Total courses:",
        userCoursesFromConvex.length
      );

      // Separate enrolled (no grade) from completed (has grade) courses
      const enrolled = userCoursesFromConvex.filter((course) => !course.grade);
      const completed = userCoursesFromConvex.filter((course) => course.grade);

      // Update local state
      setEnrolledCourses(enrolled);
      setCompletedCourses(completed);

      // Update local storage to keep it in sync
      chrome.storage.local.set(
        {
          enrolledCourses: enrolled,
          completedCourses: completed,
          lastSync: new Date().toISOString(),
        },
        () => {
          console.log(
            "Synced with Convex - Enrolled:",
            enrolled.length,
            "Completed:",
            completed.length
          );
        }
      );
    }
  }, [userCoursesFromConvex]);

  // Sync saved course offerings from Convex
  useEffect(() => {
    if (userCourseOfferingsFromConvex) {
      console.log(
        "Syncing saved courses from Convex:",
        userCourseOfferingsFromConvex.length
      );

      // Map to the format expected by the UI, filtering out any with missing courseOffering
      const savedCourses = userCourseOfferingsFromConvex
        .filter((offering) => {
          if (!offering.courseOffering) {
            console.warn(
              `Course offering not found for classNumber: ${offering.classNumber}. Skipping.`
            );
            return false;
          }
          return true;
        })
        .map((offering) => ({
          classNumber: offering.classNumber,
          courseCode: offering.courseOffering.courseCode,
          title: offering.courseOffering.title,
          section: offering.courseOffering.section,
          instructor: offering.courseOffering.instructor[0] || "",
          timeStart: offering.courseOffering.startTime,
          timeEnd: offering.courseOffering.endTime,
          location: offering.courseOffering.location,
          days: offering.courseOffering.days,
          status: offering.courseOffering.status,
        }));

      setCourseSearchSaved(savedCourses);

      // Update local storage
      chrome.storage.local.set(
        {
          courseSearchSaved: savedCourses,
          savedAt: new Date().toISOString(),
        },
        () => {
          console.log("Synced saved courses with Convex:", savedCourses.length);
        }
      );
    }
  }, [userCourseOfferingsFromConvex]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.enrolledCourses) {
        setEnrolledCourses(changes.enrolledCourses.newValue || []);
      }
      if (changes.completedCourses) {
        setCompletedCourses(changes.completedCourses.newValue || []);
      }
      if (changes.courseSearchSaved) {
        setCourseSearchSaved(changes.courseSearchSaved.newValue || []);
        console.log("Course search saved:", changes.courseSearchSaved.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const isLoading = !userCoursesFromConvex && !userCourseOfferingsFromConvex;

  return (
    <div className="w-[380px] p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="size-6 text-primary" />
        <h1 className="text-lg font-semibold">AlbertPlus</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Saved Courses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Library className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Saved Courses</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {courseSearchSaved.length} course
                {courseSearchSaved.length !== 1 ? "s" : ""} saved
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {courseSearchSaved.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No saved courses yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {courseSearchSaved.slice(0, 3).map((course, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-primary/20 pl-3 py-1"
                    >
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.courseCode} · Section {course.section}
                      </div>
                    </div>
                  ))}
                  {courseSearchSaved.length > 3 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      +{courseSearchSaved.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Courses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Enrolled Courses</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {enrolledCourses.length} course
                {enrolledCourses.length !== 1 ? "s" : ""} this semester
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {enrolledCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No enrolled courses yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {enrolledCourses.slice(0, 3).map((course, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-primary/20 pl-3 py-1"
                    >
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.courseCode}
                      </div>
                    </div>
                  ))}
                  {enrolledCourses.length > 3 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      +{enrolledCourses.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Courses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Completed Courses</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {completedCourses.length} course
                {completedCourses.length !== 1 ? "s" : ""} completed
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {completedCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed courses yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {completedCourses.slice(0, 3).map((course, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-primary/20 pl-3 py-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {course.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {course.courseCode}
                          </div>
                        </div>
                        {course.grade && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                            {course.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {completedCourses.length > 3 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      +{completedCourses.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function IndexPopup() {
  return (
    <ConvexWithClerkProvider>
      <div className="w-[380px]">
        <Unauthenticated>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <h1 className="text-lg font-semibold">AlbertPlus</h1>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Welcome</CardTitle>
                <CardDescription>
                  Sign in to sync your courses across devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignIn />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
        <Authenticated>
          <CourseDisplay />
        </Authenticated>
      </div>
    </ConvexWithClerkProvider>
  );
}

export default IndexPopup;
