import { describe, expect, test } from "bun:test";
import { JobError } from "../../lib/queue";
import { createMockDb } from "../__mocks__/db";
import { createMockEnv } from "../__mocks__/env";
import { discoverPrograms, scrapeProgram } from "./index";

describe("Programs Scraper", () => {
  describe("discoverPrograms", () => {
    test("should discover program URLs from the programs index page", async () => {
      const url = "https://bulletins.nyu.edu/programs/";
      const programUrls = await discoverPrograms(url);

      expect(Array.isArray(programUrls)).toBe(true);
      expect(programUrls.length).toBeGreaterThan(0);

      for (const programUrl of programUrls) {
        expect(typeof programUrl).toBe("string");
        expect(programUrl).toContain("bulletins.nyu.edu");
        expect(programUrl).toMatch(/\/programs\//);
      }
    });

    test("should throw error for invalid URLs", async () => {
      const invalidUrl = "https://invalid-url.example.com/programs/";
      const promise = discoverPrograms(invalidUrl);

      expect(promise).rejects.toThrow(JobError);
    });
  });

  describe("scrapeProgram", () => {
    test("should scrape a specific program page", async () => {
      const programUrl =
        "https://bulletins.nyu.edu/graduate/business/programs/accounting-ms/";

      const mockDb = createMockDb();
      const mockEnv = createMockEnv();

      const result = await scrapeProgram(programUrl, mockDb, mockEnv);

      expect(result).toHaveProperty("program");
      expect(result).toHaveProperty("requirements");
      expect(typeof result.program).toBe("object");
      expect(Array.isArray(result.requirements)).toBe(true);
    });

    test("should throw error for invalid program URLs", async () => {
      const invalidUrl = "https://bulletins.nyu.edu/programs/nonexistent/";
      const mockDb = createMockDb();
      const mockEnv = createMockEnv();
      const promise = scrapeProgram(invalidUrl, mockDb, mockEnv);

      expect(promise).rejects.toThrow(JobError);
    });
  });
});
