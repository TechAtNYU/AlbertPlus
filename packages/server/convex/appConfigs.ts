import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { protectedAdminMutation, protectedQuery } from "./helpers/auth";

export const getAppConfig = protectedQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("appConfigs")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return config?.value ?? null;
  },
});

export const getAllAppConfigs = protectedQuery({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("appConfigs").collect();
    return configs;
  },
});

export const getAppConfigInternal = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("appConfigs")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return config?.value ?? null;
  },
});

export const setAppConfig = protectedAdminMutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("appConfigs")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    }

    return await ctx.db.insert("appConfigs", {
      key: args.key,
      value: args.value,
    });
  },
});

export const removeAppConfig = protectedAdminMutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("appConfigs")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (config) {
      await ctx.db.delete(config._id);
      return true;
    }

    return false;
  },
});

// TODO: might be able to remove this function

export const setAppConfigInternal = internalMutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("appConfigs")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    }

    return await ctx.db.insert("appConfigs", {
      key: args.key,
      value: args.value,
    });
  },
});
