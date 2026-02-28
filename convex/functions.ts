import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── SKILLS ─────────────────────────────────────────────────────────────

export const getSkills = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("user_skills")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const saveSkills = mutation({
    args: { userId: v.string(), skills: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_skills")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { skills: args.skills });
        } else {
            await ctx.db.insert("user_skills", args);
        }
    },
});

// ─── ROADMAPS ───────────────────────────────────────────────────────────

export const getRoadmap = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("user_roadmaps")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const saveRoadmap = mutation({
    args: { userId: v.string(), roadmapData: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_roadmaps")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { roadmapData: args.roadmapData });
        } else {
            await ctx.db.insert("user_roadmaps", args);
        }
    },
});

export const deleteRoadmap = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_roadmaps")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

// ─── PROGRESS ───────────────────────────────────────────────────────────

export const getProgress = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("user_progress")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const saveProgress = mutation({
    args: { userId: v.string(), forgeLevel: v.number(), promptProgress: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_progress")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                forgeLevel: args.forgeLevel,
                promptProgress: args.promptProgress,
            });
        } else {
            await ctx.db.insert("user_progress", args);
        }
    },
});

// ─── BADGES ─────────────────────────────────────────────────────────────

export const getBadges = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("user_badges")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const saveBadges = mutation({
    args: { userId: v.string(), badges: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_badges")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { badges: args.badges });
        } else {
            await ctx.db.insert("user_badges", args);
        }
    },
});

// ─── SIMULATOR LOGS ─────────────────────────────────────────────────────

export const getSimulatorLog = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("simulator_logs")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const saveSimulatorLog = mutation({
    args: { userId: v.string(), logData: v.string(), completedAt: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("simulator_logs")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                logData: args.logData,
                completedAt: args.completedAt,
            });
        } else {
            await ctx.db.insert("simulator_logs", args);
        }
    },
});

// ─── LEADERBOARD ────────────────────────────────────────────────────────

export const saveLeaderboardScore = mutation({
    args: {
        userId: v.string(),
        userName: v.string(),
        totalPoints: v.number(),
        challengesDone: v.number(),
        forgeLevel: v.number(),
        topBadge: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("leaderboard_scores")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                userName: args.userName,
                totalPoints: args.totalPoints,
                challengesDone: args.challengesDone,
                forgeLevel: args.forgeLevel,
                topBadge: args.topBadge,
            });
        } else {
            await ctx.db.insert("leaderboard_scores", args);
        }
    },
});

export const getAllLeaderboardScores = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("leaderboard_scores").collect();
    },
});

