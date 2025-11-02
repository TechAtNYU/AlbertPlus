import type { internal } from "@albert-plus/server/convex/_generated/api";
import {
  ZGetAppConfig,
  type ZSetAppConfig,
  ZUpsertCourseOffering,
  ZUpsertCourseWithPrerequisites,
  ZUpsertProgramWithRequirements,
} from "@albert-plus/server/convex/http";
import type { FunctionReturnType } from "convex/server";
import * as z from "zod/mini";
import { JobError } from "./queue";

type ConvexApiConfig = {
  baseUrl: string;
  apiKey: string;
};

export class ConvexApi {
  private config: ConvexApiConfig;

  constructor(config: ConvexApiConfig) {
    this.config = config;
  }

  private async request<R>(
    path: string,
    schema: z.ZodMiniType,
    data: unknown,
  ): Promise<{ data: R }> {
    const { data: validated, success, error } = schema.safeParse(data);

    if (!success) {
      throw new JobError(
        `Invalid data shape: \n${z.prettifyError(error)}`,
        "validation",
      );
    }

    const response = await fetch(`${this.config.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.config.apiKey,
      },
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      throw new JobError(
        `HTTP ${response.status}: ${await response.text()}`,
        "network",
      );
    }

    return response.json();
  }

  async upsertCourseWithPrerequisites(
    data: z.infer<typeof ZUpsertCourseWithPrerequisites>,
  ) {
    const res = await this.request<
      FunctionReturnType<typeof internal.courses.upsertCourseInternal>
    >("/api/courses/upsert", ZUpsertCourseWithPrerequisites, data);
    return res.data;
  }

  async upsertProgramWithRequirements(
    data: z.infer<typeof ZUpsertProgramWithRequirements>,
  ) {
    const res = await this.request<
      FunctionReturnType<typeof internal.programs.upsertProgramInternal>
    >("/api/programs/upsert", ZUpsertProgramWithRequirements, data);
    return res.data;
  }

  async upsertCourseOffering(data: z.infer<typeof ZUpsertCourseOffering>) {
    const res = await this.request<
      FunctionReturnType<
        typeof internal.courseOfferings.upsertCourseOfferingInternal
      >
    >("/api/courseOfferings/upsert", ZUpsertCourseOffering, data);
    return res.data;
  }

  async getAppConfig(data: z.infer<typeof ZGetAppConfig>) {
    const res = await this.request<
      FunctionReturnType<typeof internal.appConfigs.getAppConfigInternal>
    >("api/appConfigs/get", ZGetAppConfig, data);
    return res.data;
  }

  async setAppConfig(data: z.infer<typeof ZSetAppConfig>) {
    const res = await this.request<
      FunctionReturnType<typeof internal.appConfigs.setAppConfigInternal>
    >(
      "api/appConfigs/set",
      z.object({ key: z.string(), value: z.string() }),
      data,
    );
    return res.data;
  }
}
