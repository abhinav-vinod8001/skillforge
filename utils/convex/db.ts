/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// ─── Helpers ────────────────────────────────────────────────────────────

function getUserId(): string | null {
    try {
        const user = localStorage.getItem('praxis_user');
        if (user) return JSON.parse(user).id;
    } catch { /* ignore */ }
    return null;
}

let _client: ConvexHttpClient | null = null;
function getClient(): ConvexHttpClient | null {
    if (_client) return _client;
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    _client = new ConvexHttpClient(url);
    return _client;
}

// ─── SKILLS ─────────────────────────────────────────────────────────────

export async function saveSkills(skills: string[]): Promise<void> {
    localStorage.setItem('skillforge_skills', JSON.stringify(skills));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveSkills, {
            userId, skills: JSON.stringify(skills),
        });
    } catch (e) { console.warn('Convex saveSkills failed:', e); }
}

export async function getSkills(): Promise<string[]> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getSkills, { userId });
            if (doc) {
                const skills = JSON.parse(doc.skills);
                localStorage.setItem('skillforge_skills', JSON.stringify(skills));
                return skills;
            }
        } catch (e) { console.warn('Convex getSkills failed:', e); }
    }
    try {
        const saved = localStorage.getItem('skillforge_skills');
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
}

export const getUserSkills = getSkills;

// ─── ROADMAP ────────────────────────────────────────────────────────────

export async function saveRoadmap(roadmap: Record<string, unknown>): Promise<void> {
    localStorage.setItem('skillforge_roadmap', JSON.stringify(roadmap));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveRoadmap, {
            userId, roadmapData: JSON.stringify(roadmap),
        });
    } catch (e) { console.warn('Convex saveRoadmap failed:', e); }
}

export async function getRoadmap(): Promise<Record<string, unknown> | null> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getRoadmap, { userId });
            if (doc) {
                const roadmap = JSON.parse(doc.roadmapData);
                localStorage.setItem('skillforge_roadmap', JSON.stringify(roadmap));
                return roadmap;
            }
        } catch (e) { console.warn('Convex getRoadmap failed:', e); }
    }
    try {
        const saved = localStorage.getItem('skillforge_roadmap');
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
}

export async function deleteRoadmap(): Promise<void> {
    localStorage.removeItem('skillforge_roadmap');
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.deleteRoadmap, { userId });
    } catch (e) { console.warn('Convex deleteRoadmap failed:', e); }
}

// ─── PROGRESS ───────────────────────────────────────────────────────────

export async function saveProgress(forgeLevel: number, promptProgress: Record<string, unknown>): Promise<void> {
    localStorage.setItem('skillforge_forge_level', forgeLevel.toString());
    localStorage.setItem('skillforge_prompt_progress', JSON.stringify(promptProgress));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveProgress, {
            userId, forgeLevel, promptProgress: JSON.stringify(promptProgress),
        });
    } catch (e) { console.warn('Convex saveProgress failed:', e); }
}

export async function getProgress(): Promise<{ forgeLevel: number; promptProgress: Record<string, unknown> }> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getProgress, { userId });
            if (doc) {
                const result = {
                    forgeLevel: doc.forgeLevel,
                    promptProgress: JSON.parse(doc.promptProgress),
                };
                localStorage.setItem('skillforge_forge_level', result.forgeLevel.toString());
                localStorage.setItem('skillforge_prompt_progress', JSON.stringify(result.promptProgress));
                return result;
            }
        } catch (e) { console.warn('Convex getProgress failed:', e); }
    }
    const forgeLevel = parseInt(localStorage.getItem('skillforge_forge_level') || '0', 10);
    let promptProgress: Record<string, unknown> = {};
    try {
        const saved = localStorage.getItem('skillforge_prompt_progress');
        if (saved) promptProgress = JSON.parse(saved);
    } catch { /* ignore */ }
    return { forgeLevel, promptProgress };
}

export async function saveForgeLevel(level: number): Promise<void> {
    localStorage.setItem('skillforge_forge_level', level.toString());
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    let promptProgress: Record<string, unknown> = {};
    try {
        const saved = localStorage.getItem('skillforge_prompt_progress');
        if (saved) promptProgress = JSON.parse(saved);
    } catch { /* ignore */ }
    try {
        await client.mutation(api.functions.saveProgress, {
            userId, forgeLevel: level, promptProgress: JSON.stringify(promptProgress),
        });
    } catch (e) { console.warn('Convex saveForgeLevel failed:', e); }
}

export async function savePromptProgress(promptProgress: Record<string, unknown>): Promise<void> {
    localStorage.setItem('skillforge_prompt_progress', JSON.stringify(promptProgress));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    const forgeLevel = parseInt(localStorage.getItem('skillforge_forge_level') || '0', 10);
    try {
        await client.mutation(api.functions.saveProgress, {
            userId, forgeLevel, promptProgress: JSON.stringify(promptProgress),
        });
    } catch (e) { console.warn('Convex savePromptProgress failed:', e); }
}

// ─── BADGES ─────────────────────────────────────────────────────────────

export async function saveBadges(badges: string[]): Promise<void> {
    localStorage.setItem('skillforge_prompt_badges', JSON.stringify(badges));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveBadges, {
            userId, badges: JSON.stringify(badges),
        });
    } catch (e) { console.warn('Convex saveBadges failed:', e); }
}

export async function getBadges(): Promise<string[]> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getBadges, { userId });
            if (doc) {
                const badges = JSON.parse(doc.badges);
                localStorage.setItem('skillforge_prompt_badges', JSON.stringify(badges));
                return badges;
            }
        } catch (e) { console.warn('Convex getBadges failed:', e); }
    }
    try {
        const saved = localStorage.getItem('skillforge_prompt_badges');
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
}

// ─── SIMULATOR LOGS ─────────────────────────────────────────────────────

export async function saveSimulatorLog(logData: Record<string, unknown>): Promise<void> {
    localStorage.setItem('skillforge_log', JSON.stringify(logData));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveSimulatorLog, {
            userId, logData: JSON.stringify(logData), completedAt: new Date().toISOString(),
        });
    } catch (e) { console.warn('Convex saveSimulatorLog failed:', e); }
}

export async function getSimulatorLog(): Promise<Record<string, unknown> | null> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getSimulatorLog, { userId });
            if (doc) {
                const log = JSON.parse(doc.logData);
                localStorage.setItem('skillforge_log', JSON.stringify(log));
                return log;
            }
        } catch (e) { console.warn('Convex getSimulatorLog failed:', e); }
    }
    try {
        const saved = localStorage.getItem('skillforge_log');
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
}
