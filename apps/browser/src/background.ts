import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../packages/server/convex/_generated/api";

// Initialize Convex client
const convex = new ConvexHttpClient(
  process.env.PLASMO_PUBLIC_CONVEX_URL as string,
);

// Store auth token
let cachedAuthToken: string | null = null;

// Type for valid grade values
type ValidGrade =
  | "a"
  | "a-"
  | "b+"
  | "b"
  | "b-"
  | "c+"
  | "c"
  | "c-"
  | "d+"
  | "d"
  | "p"
  | "f"
  | "w";

// Helper to save courses to Convex
async function saveCoursesToConvex(
  courses: Array<{
    courseCode: string;
    title: string;
    year: number;
    term: "spring" | "summer" | "fall" | "j-term";
    grade?: string;
  }>,
) {
  try {
    if (!cachedAuthToken) {
      console.error("No auth token available. User must be signed in.");
      return {
        success: false,
        error: "Not authenticated. Please sign in first.",
      };
    }

    // Call the importUserCourses mutation
    const result = await convex.mutation(api.userCourses.importUserCourses, {
      courses: courses.map((course) => ({
        courseCode: course.courseCode,
        title: course.title,
        year: course.year,
        term: course.term,
        ...(course.grade && { grade: course.grade as ValidGrade }),
      })),
    });

    console.log("Successfully saved to Convex:", result);
    return { success: true, result };
  } catch (error) {
    console.error("Error saving to Convex:", error);
    return { success: false, error: (error as Error).message };
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.type) {
    case "UPDATE_AUTH_TOKEN":
      // Update cached auth token from sidepanel
      cachedAuthToken = request.token;
      if (cachedAuthToken) {
        convex.setAuth(cachedAuthToken);
      } else {
        convex.clearAuth();
      }
      sendResponse({ success: true });
      return true;

    case "SAVE_ENROLLED_COURSES":
      // Save to Convex only
      (async () => {
        const coursesWithTitle = request.payload.map((course: any) => ({
          ...course,
          title: course.title || "Enrolled Course", // Fallback title
        }));

        const result = await saveCoursesToConvex(coursesWithTitle);
        console.log("Saved enrolled courses to Convex:", result);
        sendResponse(result);
      })();

      // Return true to indicate we'll send response asynchronously
      return true;

    case "SAVE_COMPLETED_COURSES":
      // Save to Convex only
      (async () => {
        const result = await saveCoursesToConvex(request.payload);
        console.log("Saved completed courses to Convex:", result);
        sendResponse(result);
      })();

      // Return true to indicate we'll send response asynchronously
      return true;

    case "SAVE_COURSE_SEARCH":
      // Save to Convex only
      (async () => {
        try {
          if (!cachedAuthToken) {
            console.error("No auth token available for saving course search");
            sendResponse({
              success: false,
              error: "Not authenticated. Please sign in first.",
            });
            return;
          }

          // Call the addUserCourseOffering mutation
          const result = await convex.mutation(
            api.userCourseOfferings.addUserCourseOffering,
            {
              classNumber: parseInt(request.payload.classNumber),
              alternativeOf: undefined, // Can be extended later for alternative courses
            },
          );

          console.log("Successfully saved course search to Convex:", result);
          sendResponse({ success: true, result });
        } catch (error) {
          console.error("Error saving course search to Convex:", error);
          sendResponse({
            success: false,
            error: (error as Error).message,
          });
        }
      })();

      return true;

    default:
      console.log("Unknown message type:", request.type);
      sendResponse({ error: "Unknown message type" });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
