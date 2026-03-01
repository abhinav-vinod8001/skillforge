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

// ─── SYLLABUS ───────────────────────────────────────────────────────────

export async function saveSyllabus(syllabus: Record<string, unknown>): Promise<void> {
    localStorage.setItem('skillforge_syllabus', JSON.stringify(syllabus));
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveSyllabus, {
            userId, syllabusData: JSON.stringify(syllabus),
        });
    } catch (e) { console.warn('Convex saveSyllabus failed:', e); }
}

export async function getSyllabus(): Promise<Record<string, unknown> | null> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getSyllabus, { userId });
            if (doc) {
                const syllabus = JSON.parse(doc.syllabusData);
                localStorage.setItem('skillforge_syllabus', JSON.stringify(syllabus));
                return syllabus;
            }
        } catch (e) { console.warn('Convex getSyllabus failed:', e); }
    }
    try {
        const saved = localStorage.getItem('skillforge_syllabus');
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
}

// ─── CHAPTERS ───────────────────────────────────────────────────────────

export async function saveChapter(phase: number, content: string): Promise<void> {
    localStorage.setItem(`skillforge_chapter_${phase}`, content);
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.saveChapter, {
            userId, phase, content,
        });
    } catch (e) { console.warn('Convex saveChapter failed:', e); }
}

export async function getChapter(phase: number): Promise<string | null> {
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getChapter, { userId, phase });
            if (doc) {
                localStorage.setItem(`skillforge_chapter_${phase}`, doc.content);
                return doc.content;
            }
        } catch (e) { console.warn('Convex getChapter failed:', e); }
    }
    try {
        const saved = localStorage.getItem(`skillforge_chapter_${phase}`);
        if (saved) return saved;
    } catch { /* ignore */ }
    return null;
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
    syncLeaderboard();
}

export async function getProgress(): Promise<{ forgeLevel: number; promptProgress: Record<string, unknown>; completedModules: number[] }> {
    const defaultData = { forgeLevel: 1, promptProgress: {}, completedModules: [] };
    const client = getClient();
    const userId = getUserId();
    if (client && userId) {
        try {
            const doc = await client.query(api.functions.getProgress, { userId });
            if (doc) {
                const result = {
                    forgeLevel: doc.forgeLevel,
                    promptProgress: JSON.parse(doc.promptProgress),
                    completedModules: doc.completedModules ? JSON.parse(doc.completedModules) : []
                };
                localStorage.setItem('skillforge_forge_level', result.forgeLevel.toString());
                localStorage.setItem('skillforge_prompt_progress', JSON.stringify(result.promptProgress));
                localStorage.setItem('skillforge_completed_modules', JSON.stringify(result.completedModules));
                return result;
            }
        } catch (e) { console.warn('Convex getProgress failed:', e); }
    }
    const forgeLevel = parseInt(localStorage.getItem('skillforge_forge_level') || '0', 10);
    let promptProgress: Record<string, unknown> = {};
    let completedModules: number[] = [];
    try {
        const saved = localStorage.getItem('skillforge_prompt_progress');
        if (saved) promptProgress = JSON.parse(saved);
        const savedMods = localStorage.getItem('skillforge_completed_modules');
        if (savedMods) completedModules = JSON.parse(savedMods);
    } catch { /* ignore */ }
    return { forgeLevel, promptProgress, completedModules };
}

export async function markModuleComplete(phase: number): Promise<void> {
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.markModuleComplete, { userId, phase });
    } catch (e) { console.warn('Convex markModuleComplete failed:', e); }
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
    syncLeaderboard();
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
    syncLeaderboard();
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
    syncLeaderboard();
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

// ─── LEADERBOARD ────────────────────────────────────────────────────────

function getUserName(): string {
    try {
        const user = localStorage.getItem('praxis_user');
        if (user) return JSON.parse(user).name || 'User';
    } catch { /* ignore */ }
    return 'User';
}

function getTopBadge(badges: string[]): string {
    if (badges.includes('prompt-master')) return '🏆 Prompt Master';
    if (badges.includes('prompt-engineer')) return '⚙️ Prompt Engineer';
    if (badges.includes('prompt-apprentice')) return '📝 Apprentice';
    if (badges.includes('forge-veteran')) return '🔥 Forge Veteran';
    if (badges.includes('forge-starter')) return '⚡ Forge Starter';
    if (badges.includes('first-attempt')) return '🎯 First Attempt';
    return '—';
}

export async function syncLeaderboard(): Promise<void> {
    const client = getClient();
    const userId = getUserId();
    if (!client || !userId) return;

    try {
        // Compute total points from all sources
        const forgeLevel = parseInt(localStorage.getItem('skillforge_forge_level') || '0', 10);
        let promptProgress: Record<string, any> = {};
        try {
            const saved = localStorage.getItem('skillforge_prompt_progress');
            if (saved) promptProgress = JSON.parse(saved);
        } catch { /* ignore */ }

        let badges: string[] = [];
        try {
            const saved = localStorage.getItem('skillforge_prompt_badges');
            if (saved) badges = JSON.parse(saved);
        } catch { /* ignore */ }

        let totalPoints = forgeLevel * 50;
        let challengesDone = 0;
        for (const key of Object.keys(promptProgress)) {
            const p = promptProgress[key] as { bestScore?: number; completed?: boolean };
            totalPoints += p.bestScore || 0;
            if (p.completed) challengesDone++;
        }
        totalPoints += badges.length * 25;

        await client.mutation(api.functions.saveLeaderboardScore, {
            userId,
            userName: getUserName(),
            totalPoints,
            challengesDone,
            forgeLevel,
            topBadge: getTopBadge(badges),
        });
    } catch (e) { console.warn('Convex syncLeaderboard failed:', e); }
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    totalPoints: number;
    challengesDone: number;
    forgeLevel: number;
    topBadge: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    const client = getClient();
    if (!client) return [];
    try {
        const docs = await client.query(api.functions.getAllLeaderboardScores, {});
        return docs.map((d: any) => ({
            userId: d.userId,
            userName: d.userName,
            totalPoints: d.totalPoints,
            challengesDone: d.challengesDone,
            forgeLevel: d.forgeLevel,
            topBadge: d.topBadge,
        }));
    } catch (e) {
        console.warn('Convex getLeaderboard failed:', e);
        return [];
    }
}

// ─── ACCOUNT RESET ────────────────────────────────────────────────────────

export async function resetAccount(): Promise<void> {
    const client = getClient();
    const userId = getUserId();

    // Clear local storage metrics
    const keysToRemove = [
        'skillforge_skills',
        'skillforge_roadmap',
        'skillforge_syllabus',
        'skillforge_forge_level',
        'skillforge_prompt_progress',
        'skillforge_prompt_badges',
        'skillforge_simulator_log',
        'praxis_user'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    if (!client || !userId) return;
    try {
        await client.mutation(api.functions.resetUserAccount, { userId });
    } catch (e) {
        console.warn('Convex resetUserAccount failed:', e);
    }
}

