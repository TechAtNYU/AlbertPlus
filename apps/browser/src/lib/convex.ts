import { ConvexClient } from "convex/browser";

export function getConvexClient() {
  const convex = new ConvexClient(
    process.env.PLASMO_PUBLIC_CONVEX_URL as string,
  );
  return convex;
}
