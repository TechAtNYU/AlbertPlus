import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useAuth } from "@clerk/chrome-extension";
import { BookOpen, GraduationCap, Library, Clock, MapPin } from "lucide-react";
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
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const isLoading = !userCoursesFromConvex && !userCourseOfferingsFromConvex;

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="size-7 text-primary" />
          <h1 className="text-xl font-semibold">AlbertPlus</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Saved Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Library className="size-5 text-muted-foreground" />
                  <CardTitle>Saved Courses</CardTitle>
                </div>
                <CardDescription>
                  {courseSearchSaved.length} course
                  {courseSearchSaved.length !== 1 ? "s" : ""} saved from search
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courseSearchSaved.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No saved courses yet. Browse the course catalog and click
                    "Save Course to A+" to add courses here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {courseSearchSaved.map((course, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold">{course.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {course.courseCode} · Section {course.section}
                            </div>
                          </div>
                          {course.instructor && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <span>👨‍🏫</span>
                              <span>{course.instructor}</span>
                            </div>
                          )}
                          {course.timeStart && course.timeEnd && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span>
                                {course.timeStart} - {course.timeEnd}
                              </span>
                            </div>
                          )}
                          {course.location && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="size-3.5" />
                              <span>{course.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrolled Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-muted-foreground" />
                  <CardTitle>Enrolled Courses</CardTitle>
                </div>
                <CardDescription>
                  {enrolledCourses.length} course
                  {enrolledCourses.length !== 1 ? "s" : ""} this semester
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No enrolled courses yet. Visit your schedule on Albert to
                    see your enrolled courses.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {enrolledCourses.map((course, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="font-semibold">{course.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {course.courseCode}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-muted-foreground" />
                  <CardTitle>Completed Courses</CardTitle>
                </div>
                <CardDescription>
                  {completedCourses.length} course
                  {completedCourses.length !== 1 ? "s" : ""} completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No completed courses yet. Visit your transcript on Albert to
                    import your grades.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {completedCourses.map((course, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">{course.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {course.courseCode}
                            </div>
                          </div>
                          {course.grade && (
                            <span className="text-sm font-bold px-3 py-1.5 rounded-md bg-primary/10 text-primary uppercase shrink-0">
                              {course.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function IndexSidePanel() {
  return (
    <ConvexWithClerkProvider>
      <div className="h-screen bg-background">
        <Unauthenticated>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="size-7 text-primary" />
              <h1 className="text-xl font-semibold">AlbertPlus</h1>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Welcome to AlbertPlus</CardTitle>
                <CardDescription>
                  Sign in to sync your courses, track your progress, and get
                  personalized recommendations
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

export default IndexSidePanel;
