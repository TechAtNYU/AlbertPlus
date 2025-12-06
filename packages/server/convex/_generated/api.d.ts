/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appConfigs from "../appConfigs.js";
import type * as courseOfferings from "../courseOfferings.js";
import type * as courses from "../courses.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as http from "../http.js";
import type * as prerequisites from "../prerequisites.js";
import type * as programs from "../programs.js";
import type * as requirements from "../requirements.js";
import type * as schemas_appConfigs from "../schemas/appConfigs.js";
import type * as schemas_courseOfferings from "../schemas/courseOfferings.js";
import type * as schemas_courses from "../schemas/courses.js";
import type * as schemas_programs from "../schemas/programs.js";
import type * as schemas_schools from "../schemas/schools.js";
import type * as schemas_studentInvites from "../schemas/studentInvites.js";
import type * as schemas_students from "../schemas/students.js";
import type * as schools from "../schools.js";
import type * as scraper from "../scraper.js";
import type * as seed from "../seed.js";
import type * as studentInvites from "../studentInvites.js";
import type * as students from "../students.js";
import type * as userCourseOfferings from "../userCourseOfferings.js";
import type * as userCourses from "../userCourses.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appConfigs: typeof appConfigs;
  courseOfferings: typeof courseOfferings;
  courses: typeof courses;
  "helpers/auth": typeof helpers_auth;
  http: typeof http;
  prerequisites: typeof prerequisites;
  programs: typeof programs;
  requirements: typeof requirements;
  "schemas/appConfigs": typeof schemas_appConfigs;
  "schemas/courseOfferings": typeof schemas_courseOfferings;
  "schemas/courses": typeof schemas_courses;
  "schemas/programs": typeof schemas_programs;
  "schemas/schools": typeof schemas_schools;
  "schemas/studentInvites": typeof schemas_studentInvites;
  "schemas/students": typeof schemas_students;
  schools: typeof schools;
  scraper: typeof scraper;
  seed: typeof seed;
  studentInvites: typeof studentInvites;
  students: typeof students;
  userCourseOfferings: typeof userCourseOfferings;
  userCourses: typeof userCourses;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
