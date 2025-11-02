export function createMockEnv(): CloudflareBindings {
  return {
    CONVEX_URL: "https://test.convex.cloud",
    CONVEX_DEPLOY_KEY: "test-key",
  } as any;
}
