'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, getBadges, getSimulatorLog } from '@/utils/convex/db';
import {
    UploadCloud,
    TrendingUp,
    Map,
    FolderGit2,
    TerminalSquare,
    Briefcase,
    ArrowRight,
    Zap,
    Trophy,
    Target,
    BarChart3,
} from 'lucide-react';
import styles from './home.module.css';

const FEATURES = [
    {
        label: 'My Roadmap',
        href: '/dashboard/roadmap',
        icon: Map,
        color: '#d2a8ff',
        bgColor: 'rgba(210, 168, 255, 0.14)',
        description: 'AI-generated personalized learning path bridging your skills to industry needs.',
    },
    {
        label: 'Forge Projects',
        href: '/dashboard/project',
        icon: FolderGit2,
        color: '#f0883e',
        bgColor: 'rgba(240, 136, 62, 0.14)',
        description: 'Find and fix real security flaws, refactor code, and pass the AI tribunal review.',
    },
    {
        label: 'Prompt Lab',
        href: '/dashboard/prompt-engineering',
        icon: TerminalSquare,
        color: '#56d364',
        bgColor: 'rgba(86, 211, 100, 0.14)',
        description: 'Master prompt engineering through scenario-based challenges and compete on the leaderboard.',
    },
    {
        label: 'Intern Simulator',
        href: '/dashboard/simulator',
        icon: Briefcase,
        color: '#79c0ff',
        bgColor: 'rgba(121, 192, 255, 0.14)',
        description: 'Experience a full day as an engineer with agile standups, jira tickets, and retros.',
    },
];

export default function DashboardHome() {
    const [forgeLevel, setForgeLevel] = useState(0);
    const [promptChallenges, setPromptChallenges] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [badgeCount, setBadgeCount] = useState(0);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const { forgeLevel: fl, promptProgress: pp } = await getProgress();
                setForgeLevel(fl);

                const completed = Object.values(pp).filter(
                    (p: unknown) => (p as { completed: boolean }).completed
                ).length;
                setPromptChallenges(completed);

                const pts = Object.values(pp).reduce(
                    (sum: number, p: unknown) => sum + ((p as { bestScore: number }).bestScore || 0),
                    0
                );
                setTotalPoints(pts + fl * 50);

                const b = await getBadges();
                const badgeList = [...b];

                if (fl >= 1 && !badgeList.includes('forge-starter')) badgeList.push('forge-starter');
                if (fl >= 3 && !badgeList.includes('forge-veteran')) badgeList.push('forge-veteran');

                const simLog = await getSimulatorLog();
                if (simLog) {
                    try {
                        const logString = (simLog as Record<string, unknown>).logData as string;
                        const parsedLog = JSON.parse(logString);
                        if (parsedLog.score >= 70 && !badgeList.includes('certified')) badgeList.push('certified');
                    } catch { }
                }

                setBadgeCount(badgeList.length);
            } catch {
                // data unavailable
            }
        };
        loadStats();
    }, []);

    return (
        <div className={styles.homePage}>
            {/* Welcome */}
            <div className={styles.welcomeSection}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>Career Command Center</span>
                    <h1 className={styles.welcomeTitle}>
                        Welcome back to the <span className="text-gradient">Forge</span>
                    </h1>
                </div>
                <p className={styles.welcomeSub}>
                    Bridge the gap between theoretical knowledge and senior-level execution. Select an active module below.
                </p>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(240, 136, 62, 0.12)' }}>
                        <Target size={20} color="#f0883e" />
                    </div>
                    <span className={styles.statValue}>{forgeLevel}</span>
                    <span className={styles.statLabel}>Missions Done</span>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(86, 211, 100, 0.12)' }}>
                        <Zap size={20} color="#56d364" />
                    </div>
                    <span className={styles.statValue}>{promptChallenges}</span>
                    <span className={styles.statLabel}>Challenges Done</span>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(88, 166, 255, 0.12)' }}>
                        <BarChart3 size={20} color="#58a6ff" />
                    </div>
                    <span className={styles.statValue}>{totalPoints}</span>
                    <span className={styles.statLabel}>Total Points</span>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(210, 168, 255, 0.12)' }}>
                        <Trophy size={20} color="#d2a8ff" />
                    </div>
                    <span className={styles.statValue}>{badgeCount}</span>
                    <span className={styles.statLabel}>Badges Earned</span>
                </div>
            </div>

            {/* Feature Cards */}
            <div className={styles.sectionHeader}>
                <BarChart3 size={18} />
                <span>Modules</span>
            </div>
            <div className={styles.cardGrid}>
                {FEATURES.map((feat) => {
                    const Icon = feat.icon;
                    return (
                        <Link
                            key={feat.href}
                            href={feat.href}
                            className={styles.featureCard}
                            style={{ '--card-accent': feat.color, '--card-accent-bg': feat.bgColor } as React.CSSProperties}
                        >
                            <div className={styles.cardIcon}>
                                <Icon size={22} color={feat.color} />
                            </div>
                            <div className={styles.cardTitle}>{feat.label}</div>
                            <div className={styles.cardDesc}>{feat.description}</div>
                            <div className={styles.cardFooter}>
                                <span>Open</span>
                                <ArrowRight size={14} />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
