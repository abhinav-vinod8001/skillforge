import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    user_skills: defineTable({
        userId: v.string(),
        skills: v.string(), // JSON stringified array
    }).index("by_userId", ["userId"]),

    user_roadmaps: defineTable({
        userId: v.string(),
        roadmapData: v.string(), // JSON stringified roadmap
    }).index("by_userId", ["userId"]),

    user_progress: defineTable({
        userId: v.string(),
        forgeLevel: v.number(),
        promptProgress: v.string(), // JSON stringified progress object
    }).index("by_userId", ["userId"]),

    user_badges: defineTable({
        userId: v.string(),
        badges: v.string(), // JSON stringified array
    }).index("by_userId", ["userId"]),

    simulator_logs: defineTable({
        userId: v.string(),
        logData: v.string(), // JSON stringified log
        completedAt: v.string(),
    }).index("by_userId", ["userId"]),
});
