'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Trophy,
    Target,
    Zap,
    Star,
    Shield,
    Code2,
    Briefcase,
    BookOpen,
    Award,
    Lock,
    BarChart3,
    FileBadge,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { getProgress, getBadges, getSkills, getSimulatorLog, saveBadges, resetAccount } from '@/utils/convex/db';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

// ─── LEVEL SYSTEM ──────────────────────────────────────── //
const LEVELS = [
    { title: 'Rookie', minXP: 0, maxXP: 99, color: '#8b949e' },
    { title: 'Apprentice', minXP: 100, maxXP: 249, color: '#3fb950' },
    { title: 'Practitioner', minXP: 250, maxXP: 499, color: '#58a6ff' },
    { title: 'Engineer', minXP: 500, maxXP: 799, color: '#d2a8ff' },
    { title: 'Architect', minXP: 800, maxXP: 9999, color: '#ffd700' },
];

const ALL_BADGES = [
    { id: 'first-attempt', name: 'First Attempt', icon: '🎯', desc: 'Completed your first challenge' },
    { id: 'prompt-apprentice', name: 'Prompt Apprentice', icon: '📝', desc: 'Scored 60+ on a challenge' },
    { id: 'prompt-engineer', name: 'Prompt Engineer', icon: '⚙️', desc: 'Scored 80+ on a challenge' },
    { id: 'prompt-master', name: 'Prompt Master', icon: '🏆', desc: 'Scored 90+ on a challenge' },
    { id: 'forge-starter', name: 'Forge Starter', icon: '🔨', desc: 'Completed first forge mission' },
    { id: 'forge-veteran', name: 'Forge Veteran', icon: '🛡️', desc: 'Completed 3+ forge missions' },
    { id: 'sim-complete', name: 'Intern Survivor', icon: '💼', desc: 'Completed intern simulation' },
    { id: 'skill-scanner', name: 'Skill Scanner', icon: '📊', desc: 'Uploaded a syllabus for analysis' },
];

const FORGE_MISSION_NAMES: Record<number, string> = {
    1: 'Mission 1: The Leaky Dashboard',
    2: 'Mission 2: The Shopping Cart',
    3: 'Mission 3: Checkout System',
};

const CHALLENGE_NAMES: Record<string, string> = {
    'flood-predictor': 'Kerala Flood Predictor Bot',
    'spice-agent': 'Spice Inventory AI Agent',
    'code-debugger': 'Code Debugger Co-Pilot',
    'content-moderator': 'Regional Language Content Moderator',
    'research-summarizer': 'Academic Research Summarizer',
};

export default function ProfilePage() {
    const [userName, setUserName] = useState('User');
    const [userEmail, setUserEmail] = useState('');
    const [totalXP, setTotalXP] = useState(0);
    const [forgeLevel, setForgeLevel] = useState(0);
    const [promptChallengesDone, setPromptChallengesDone] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [simCompleted, setSimCompleted] = useState(false);
    const [allModulesCompleted, setAllModulesCompleted] = useState(false);
    const [activities, setActivities] = useState<{ text: string; label: string }[]>([]);
    const [promptProgress, setPromptProgress] = useState<Record<string, { bestScore: number; attempts: number; completed: boolean }>>({});
    const [isResetting, setIsResetting] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!confirm("Are you sure you want to completely wipe your account progress? This cannot be undone.")) return;
        setIsResetting(true);
        try {
            await resetAccount();
            router.push('/dashboard/onboarding');
        } catch (e) {
            console.error(e);
            setIsResetting(false);
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                // User info
                const user = localStorage.getItem('praxis_user');
                if (user) {
                    const parsed = JSON.parse(user);
                    setUserName(parsed.name || 'User');
                    setUserEmail(parsed.email || '');
                }

                let xp = 0;
                const activityLog: { text: string; label: string }[] = [];

                // Forge + Prompt progress
                const { forgeLevel: forgeLvl, promptProgress: pp, completedModules } = await getProgress();
                setForgeLevel(forgeLvl);

                const sysSyl = await getSyllabus() as Record<string, unknown> | null;
                if (sysSyl && sysSyl.nodes && Array.isArray(sysSyl.nodes)) {
                    if (completedModules && Array.isArray(completedModules) && completedModules.length >= sysSyl.nodes.length) {
                        setAllModulesCompleted(true);
                    }
                }
                xp += forgeLvl * 50;
                for (let i = 1; i <= forgeLvl; i++) {
                    activityLog.push({
                        text: `Completed ${FORGE_MISSION_NAMES[i] || `Forge Mission ${i}`}`,
                        label: 'Forge Projects',
                    });
                }

                if (Object.keys(pp).length > 0) {
                    setPromptProgress(pp as Record<string, { bestScore: number; attempts: number; completed: boolean; }>);
                    let challenges = 0;
                    let attempts = 0;
                    let best = 0;
                    for (const [key, val] of Object.entries(pp)) {
                        const p = val as { bestScore: number; attempts: number; completed: boolean };
                        xp += p.bestScore;
                        attempts += p.attempts;
                        if (p.bestScore > best) best = p.bestScore;
                        if (p.completed) {
                            challenges++;
                            activityLog.push({
                                text: `Scored ${p.bestScore} on ${CHALLENGE_NAMES[key] || key}`,
                                label: 'Prompt Lab',
                            });
                        }
                    }
                    setPromptChallengesDone(challenges);
                    setTotalAttempts(attempts);
                    setBestScore(best);
                }

                // Badges
                const badgeList: string[] = await getBadges();
                if (forgeLvl >= 1 && !badgeList.includes('forge-starter')) badgeList.push('forge-starter');
                if (forgeLvl >= 3 && !badgeList.includes('forge-veteran')) badgeList.push('forge-veteran');

                // Sim results
                const simLog = await getSimulatorLog();
                if (simLog) {
                    let logScore = 0;
                    try {
                        const logString = (simLog as Record<string, unknown>).logData as string;
                        const parsedLog = JSON.parse(logString);
                        logScore = parsedLog.score || 0;
                    } catch { }

                    if (logScore >= 70) {
                        setSimCompleted(true);
                        if (!badgeList.includes('sim-complete')) badgeList.push('sim-complete');
                    }
                    activityLog.push({ text: `Internship Attempt (Score: ${logScore})`, label: 'Simulator' });
                }

                // Skills
                const skillData = await getSkills();
                if (skillData.length > 0) {
                    setSkills(skillData);
                    if (!badgeList.includes('skill-scanner')) badgeList.push('skill-scanner');
                    activityLog.push({ text: 'Uploaded syllabus for skill analysis', label: 'Onboarding' });
                }

                xp += badgeList.length * 25;
                setEarnedBadges(badgeList);
                await saveBadges(badgeList);
                setTotalXP(xp);
                setActivities(activityLog.reverse());
            } catch {
                // Fallback
            }
        };
        loadProfile();
    }, []);

    // Compute level
    const currentLevel = LEVELS.find(l => totalXP >= l.minXP && totalXP <= l.maxXP) || LEVELS[0];
    const xpInLevel = totalXP - currentLevel.minXP;
    const xpForLevel = currentLevel.maxXP - currentLevel.minXP + 1;
    const xpPercent = Math.min(100, (xpInLevel / xpForLevel) * 100);

    return (
        <div className={`animate-fade-in ${styles.profilePage}`}>
            {/* ─── PROFILE HEADER ──────────────────────────── */}
            <div className={styles.profileHeader}>
                <div className={styles.avatarCircle}>
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                    <div className={styles.profileName}>{userName}</div>
                    <div className={styles.profileEmail}>{userEmail}</div>
                    <div className={styles.levelRow}>
                        <span className={styles.levelBadge} style={{ color: currentLevel.color, background: `${currentLevel.color}18` }}>
                            <Award size={14} />
                            {currentLevel.title}
                        </span>
                        <div className={styles.xpBarWrap}>
                            <div className={styles.xpLabel}>
                                <span>{totalXP} XP</span>
                                <span>Next: {currentLevel.maxXP + 1} XP</span>
                            </div>
                            <div className={styles.xpBar}>
                                <div
                                    className={styles.xpBarFill}
                                    style={{ width: `${xpPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── STATS ───────────────────────────────────── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: '#f0883e' }}>{forgeLevel}</span>
                    <span className={styles.statLabel}>Missions</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: '#56d364' }}>{promptChallengesDone}</span>
                    <span className={styles.statLabel}>Challenges</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: '#58a6ff' }}>{totalXP}</span>
                    <span className={styles.statLabel}>Total XP</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: '#d2a8ff' }}>{bestScore}</span>
                    <span className={styles.statLabel}>Best Score</span>
                </div>
            </div>

            {/* ─── TWO COLUMN: BADGES + SKILLS ─────────────── */}
            <div className={styles.twoCol}>
                {/* Badges */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Trophy size={18} color="#ffd700" />
                        Badges ({earnedBadges.length}/{ALL_BADGES.length})
                    </div>
                    <div className={styles.badgesGrid}>
                        {ALL_BADGES.map(b => {
                            const isEarned = earnedBadges.includes(b.id);
                            return (
                                <div key={b.id} className={`${styles.badgeCard} ${isEarned ? styles.earned : styles.locked}`}>
                                    {isEarned ? (
                                        <span className={styles.badgeEmoji}>{b.icon}</span>
                                    ) : (
                                        <Lock size={18} color="var(--text-secondary)" />
                                    )}
                                    <div>
                                        <div className={styles.badgeName}>{b.name}</div>
                                        <div className={styles.badgeDesc}>{b.desc}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Skills */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <BookOpen size={18} color="#58a6ff" />
                        Skills
                    </div>
                    {skills.length > 0 ? (
                        <div className={styles.skillsWrap}>
                            {skills.map((s, i) => (
                                <span key={i} className={styles.skillTag}>{s}</span>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noData}>
                            Upload your syllabus in Onboarding to see your skills here.
                        </p>
                    )}
                </div>
            </div>

            {/* ─── CERTIFICATION ─────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <FileBadge size={18} color="#d2a8ff" />
                    Official Certification
                </div>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                        To earn your Praxis AI Architect Certification, you must prove your mastery across all domains.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className={styles.statCard} style={{ opacity: totalXP >= 500 ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {totalXP >= 500 ? <CheckCircle2 size={16} color="#3fb950" /> : <Lock size={16} />}
                                <strong>Level Up</strong>
                            </div>
                            <span className={styles.statLabel}>Reach Engineer Level (500 XP)</span>
                        </div>
                        <div className={styles.statCard} style={{ opacity: forgeLevel >= 3 ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {forgeLevel >= 3 ? <CheckCircle2 size={16} color="#3fb950" /> : <Lock size={16} />}
                                <strong>Forge Master</strong>
                            </div>
                            <span className={styles.statLabel}>Complete 3+ Missions</span>
                        </div>
                        <div className={styles.statCard} style={{ opacity: promptChallengesDone >= 3 ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {promptChallengesDone >= 3 ? <CheckCircle2 size={16} color="#3fb950" /> : <Lock size={16} />}
                                <strong>Prompt Expert</strong>
                            </div>
                            <span className={styles.statLabel}>Complete 3+ Challenges</span>
                        </div>
                        <div className={styles.statCard} style={{ opacity: allModulesCompleted ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {allModulesCompleted ? <CheckCircle2 size={16} color="#3fb950" /> : <Lock size={16} />}
                                <strong>Theory Scholar</strong>
                            </div>
                            <span className={styles.statLabel}>Complete all Roadmap Modules</span>
                        </div>
                        <div className={styles.statCard} style={{ opacity: simCompleted ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {simCompleted ? <CheckCircle2 size={16} color="#3fb950" /> : <Lock size={16} />}
                                <strong>Intern Survivor</strong>
                            </div>
                            <span className={styles.statLabel}>Clear the Simulator (70+ Req)</span>
                        </div>
                    </div>

                    {(totalXP >= 500 && forgeLevel >= 3 && promptChallengesDone >= 3 && simCompleted && allModulesCompleted) ? (
                        <button className="btn-primary" style={{ width: '100%' }} onClick={() => router.push('/dashboard/export')}>
                            Download Official Certificate
                        </button>
                    ) : (
                        <button className="btn-secondary" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                            Criteria Not Met
                        </button>
                    )}
                </div>
            </div>

            {/* ─── DANGER ZONE ───────────────────────────────── */}
            <div className={styles.section} style={{ marginTop: '3rem' }}>
                <div className={styles.sectionTitle} style={{ color: '#da3633' }}>
                    <AlertTriangle size={18} />
                    Danger Zone
                </div>
                <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(218, 54, 51, 0.3)' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Reset Career Trajectory</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Need to learn a completely new technology? This will permanently wipe your syllabus, roadmap, XP, and all completed projects from the system, allowing you to start fresh without creating a new account.
                    </p>
                    <button
                        className="btn-primary"
                        style={{ background: 'rgba(218, 54, 51, 0.1)', color: '#da3633', border: '1px solid rgba(218, 54, 51, 0.4)' }}
                        onClick={handleReset}
                        disabled={isResetting}
                    >
                        {isResetting ? 'Purging Systems...' : 'Wipe Account Progress'}
                    </button>
                </div>
            </div>

            {/* ─── CHALLENGE SCORES ────────────────────────── */}
            {Object.keys(promptProgress).length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <BarChart3 size={18} color="#56d364" />
                        Challenge Scores
                    </div>
                    <div className={styles.statsRow}>
                        {Object.entries(promptProgress).map(([key, val]) => (
                            <div key={key} className={styles.statCard}>
                                <span className={styles.statValue} style={{
                                    color: val.bestScore >= 80 ? '#3fb950' : val.bestScore >= 60 ? '#d29922' : '#da3633',
                                    fontSize: '1.25rem',
                                }}>
                                    {val.bestScore}
                                </span>
                                <span className={styles.statLabel} style={{ fontSize: '0.65rem' }}>
                                    {CHALLENGE_NAMES[key] || key}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── ACTIVITY TIMELINE ───────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <Zap size={18} color="#f0883e" />
                    Activity
                </div>
                {activities.length > 0 ? (
                    <div className={styles.timeline}>
                        {activities.map((a, i) => (
                            <div key={i} className={styles.timelineItem}>
                                {a.text}
                                <span className={styles.timelineLabel}>{a.label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.noData}>
                        Start completing challenges and missions to build your activity history.
                    </p>
                )}
            </div>
        </div>
    );
}
