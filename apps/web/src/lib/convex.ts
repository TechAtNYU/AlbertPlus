import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";

export async function getAuthToken() {
  const { getToken, redirectToSignIn } = await auth();
  const token = await getToken({ template: "convex" });

  if (!token) {
    redirectToSignIn();
    throw new Error("Not authenticated");
  }

  return token;
}

export async function fetchProtectedQuery<
  Query extends FunctionReference<"query">,
>(
  query: Query,
  ...args: FunctionArgs<Query> extends Record<string, never>
    ? []
    : [FunctionArgs<Query>]
): Promise<FunctionReturnType<Query>> {
  const token = await getAuthToken();
  return await fetchQuery(query, args[0] ?? {}, { token });
}

export async function fetchProtectedMutation<
  Mutation extends FunctionReference<"mutation">,
>(
  mutation: Mutation,
  ...args: FunctionArgs<Mutation> extends Record<string, never>
    ? []
    : [FunctionArgs<Mutation>]
): Promise<FunctionReturnType<Mutation>> {
  const token = await getAuthToken();
  return await fetchMutation(mutation, args[0] ?? {}, { token });
}
