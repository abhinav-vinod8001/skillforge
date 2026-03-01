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

// ─── SYLLABUSES ───────────────────────────────────────────────────────────

export const getSyllabus = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("user_syllabuses")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const saveSyllabus = mutation({
    args: { userId: v.string(), syllabusData: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_syllabuses")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { syllabusData: args.syllabusData });
        } else {
            await ctx.db.insert("user_syllabuses", args);
        }
    },
});

// ─── CHAPTERS ─────────────────────────────────────────────────────────────

export const getChapter = query({
    args: { userId: v.string(), phase: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("user_chapters")
            .withIndex("by_userId_phase", (q) =>
                q.eq("userId", args.userId).eq("phase", args.phase)
            )
            .first();
    },
});

export const saveChapter = mutation({
    args: { userId: v.string(), phase: v.number(), content: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_chapters")
            .withIndex("by_userId_phase", (q) =>
                q.eq("userId", args.userId).eq("phase", args.phase)
            )
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { content: args.content });
        } else {
            await ctx.db.insert("user_chapters", args);
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

export const markModuleComplete = mutation({
    args: { userId: v.string(), phase: v.number() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_progress")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            let mods: number[] = [];
            if (existing.completedModules) {
                mods = JSON.parse(existing.completedModules);
            }
            if (!mods.includes(args.phase)) {
                mods.push(args.phase);
            }
            await ctx.db.patch(existing._id, { completedModules: JSON.stringify(mods) });
        } else {
            await ctx.db.insert("user_progress", {
                userId: args.userId,
                forgeLevel: 1,
                promptProgress: "{}",
                completedModules: JSON.stringify([args.phase])
            });
        }
    }
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

// ─── ACCOUNT RESET ────────────────────────────────────────────────────────

export const resetUserAccount = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const tables = [
            "user_skills",
            "user_roadmaps",
            "user_syllabuses",
            "user_progress",
            "user_badges",
            "simulator_logs",
            "leaderboard_scores"
        ] as const;

        for (const table of tables) {
            const records = await ctx.db
                .query(table)
                .withIndex("by_userId", (q) => q.eq("userId", args.userId))
                .collect();

            for (const record of records) {
                await ctx.db.delete(record._id);
            }
        }

        const chapters = await ctx.db
            .query("user_chapters")
            .withIndex("by_userId_phase", (q) => q.eq("userId", args.userId))
            .collect();
        for (const chap of chapters) {
            await ctx.db.delete(chap._id);
        }
    },
});

