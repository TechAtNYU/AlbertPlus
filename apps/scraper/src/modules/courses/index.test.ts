import { describe, expect, test } from "bun:test";
import { JobError } from "../../lib/queue";
import { createMockDb } from "../__mocks__/db";
import { createMockEnv } from "../__mocks__/env";
import { discoverCourses, scrapeCourse } from "./index";

describe("Courses Scraper", () => {
  describe("discoverCourses", () => {
    test("should discover course category URLs from the courses index page", async () => {
      const courseUrls = await discoverCourses(
        "https://bulletins.nyu.edu/courses/",
      );

      expect(Array.isArray(courseUrls)).toBe(true);
      expect(courseUrls.length).toBeGreaterThan(0);

      for (const courseUrl of courseUrls) {
        expect(typeof courseUrl).toBe("string");
        expect(courseUrl).toContain("bulletins.nyu.edu");
        expect(courseUrl).toMatch(/\/courses\//);
      }
    });

    test("should handle invalid URLs gracefully", async () => {
      expect(
        discoverCourses("https://invalid-url.example.com/courses/"),
      ).rejects.toThrow(JobError);
    });
  });

  describe("scrapeCourse", () => {
    test("should scrape a specific course category page", async () => {
      const mockDb = createMockDb();
      const mockEnv = createMockEnv();

      const result = await scrapeCourse(
        "https://bulletins.nyu.edu/courses/acct_gb/",
        mockDb,
        mockEnv,
      );

      expect(result).toHaveProperty("course");
      expect(result).toHaveProperty("prerequisites");
      expect(typeof result.course).toBe("object");
      expect(Array.isArray(result.prerequisites)).toBe(true);
    });

    test("should handle invalid course URLs", async () => {
      const mockDb = createMockDb();
      const mockEnv = createMockEnv();

      expect(
        scrapeCourse(
          "https://bulletins.nyu.edu/courses/nonexistent/",
          mockDb,
          mockEnv,
        ),
      ).rejects.toThrow(JobError);
    });
  });
});
