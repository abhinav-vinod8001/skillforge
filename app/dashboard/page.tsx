'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
        label: 'Onboarding',
        href: '/dashboard/onboarding',
        icon: UploadCloud,
        color: '#3fb950',
        bgColor: 'rgba(63, 185, 80, 0.1)',
        description: 'Upload your curriculum or syllabus to uncover skill gaps against real market demand.',
    },
    {
        label: 'Market Trends',
        href: '/dashboard/trends',
        icon: TrendingUp,
        color: '#58a6ff',
        bgColor: 'rgba(88, 166, 255, 0.1)',
        description: 'Live industry demand analysis scraped from job boards and tech news.',
    },
    {
        label: 'My Roadmap',
        href: '/dashboard/roadmap',
        icon: Map,
        color: '#d2a8ff',
        bgColor: 'rgba(210, 168, 255, 0.1)',
        description: 'AI-generated personalized learning path bridging your skills to industry needs.',
    },
    {
        label: 'Forge Projects',
        href: '/dashboard/project',
        icon: FolderGit2,
        color: '#f0883e',
        bgColor: 'rgba(240, 136, 62, 0.1)',
        description: 'Find and fix real security flaws, refactor code, and pass the AI tribunal review.',
    },
    {
        label: 'Prompt Lab',
        href: '/dashboard/prompt-engineering',
        icon: TerminalSquare,
        color: '#56d364',
        bgColor: 'rgba(86, 211, 100, 0.1)',
        description: 'Master prompt engineering through scenario-based challenges and compete on the leaderboard.',
    },
    {
        label: 'Intern Simulator',
        href: '/dashboard/simulator',
        icon: Briefcase,
        color: '#79c0ff',
        bgColor: 'rgba(121, 192, 255, 0.1)',
        description: 'Experience a full day as a software engineering intern with standups, tickets, and retros.',
    },
];

export default function DashboardHome() {
    const [forgeLevel, setForgeLevel] = useState(0);
    const [promptChallenges, setPromptChallenges] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [badgeCount, setBadgeCount] = useState(0);

    useEffect(() => {
        // Pull stats from localStorage
        try {
            const level = localStorage.getItem('skillforge_forge_level');
            if (level) setForgeLevel(parseInt(level, 10));

            const progress = localStorage.getItem('skillforge_prompt_progress');
            if (progress) {
                const parsed = JSON.parse(progress);
                const completed = Object.values(parsed).filter(
                    (p: unknown) => (p as { completed: boolean }).completed
                ).length;
                setPromptChallenges(completed);

                // Calculate total points from best scores
                const pts = Object.values(parsed).reduce(
                    (sum: number, p: unknown) => sum + ((p as { bestScore: number }).bestScore || 0),
                    0
                );
                setTotalPoints(pts + forgeLevel * 50);
            }

            const badges = localStorage.getItem('skillforge_prompt_badges');
            if (badges) setBadgeCount(JSON.parse(badges).length);
        } catch {
            // localStorage unavailable
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.homePage}>
            {/* Welcome */}
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>
                    Welcome to <span className="text-gradient">Praxis AI</span>
                </h1>
                <p className={styles.welcomeSub}>
                    Bridge the gap between theory and practice. Pick a module below to start learning by doing.
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
