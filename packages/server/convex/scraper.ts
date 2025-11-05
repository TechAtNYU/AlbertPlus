import { ConvexError } from "convex/values";
import { protectedAdminAction } from "./helpers/auth";

/**
 * Action to trigger major (program) discovery scraping
 * This calls the scraper worker's /api/trigger-majors endpoint
 */
export const triggerMajorsScraping = protectedAdminAction({
  args: {},
  handler: async () => {
    const scraperUrl = process.env.SCRAPER_URL;
    const apiKey = process.env.CONVEX_API_KEY;

    if (!scraperUrl) {
      throw new ConvexError(
        "SCRAPER_URL environment variable is not configured",
      );
    }

    if (!apiKey) {
      throw new ConvexError(
        "CONVEX_API_KEY environment variable is not configured",
      );
    }

    const response = await fetch(`${scraperUrl}/api/majors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ConvexError(
        `Failed to trigger majors scraping: ${response.status} ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  },
});

/**
 * Action to trigger course discovery scraping
 * This calls the scraper worker's /api/trigger-courses endpoint
 */
export const triggerCoursesScraping = protectedAdminAction({
  args: {},
  handler: async () => {
    const scraperUrl = process.env.SCRAPER_URL;
    const apiKey = process.env.CONVEX_API_KEY;

    if (!scraperUrl) {
      throw new ConvexError(
        "SCRAPER_URL environment variable is not configured",
      );
    }

    if (!apiKey) {
      throw new ConvexError(
        "CONVEX_API_KEY environment variable is not configured",
      );
    }

    const response = await fetch(`${scraperUrl}/api/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ConvexError(
        `Failed to trigger courses scraping: ${response.status} ${errorText}`,
      );
    }

    const result = await response.json();
    return result;
  },
});
