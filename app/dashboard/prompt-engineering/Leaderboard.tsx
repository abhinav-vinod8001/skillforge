'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import { getProgress, getBadges } from '@/utils/convex/db';
import styles from './leaderboard.module.css';

// Simulated competitor data with realistic Indian names
const SIMULATED_USERS = [
    { name: 'Arjun Menon', points: 385, challengesDone: 5, badge: '🏆 Prompt Master', color: '#f0883e' },
    { name: 'Sneha Nair', points: 340, challengesDone: 4, badge: '⚙️ Prompt Engineer', color: '#d2a8ff' },
    { name: 'Rahul Krishnan', points: 310, challengesDone: 5, badge: '⚙️ Prompt Engineer', color: '#58a6ff' },
    { name: 'Aiswarya S', points: 275, challengesDone: 4, badge: '📝 Apprentice', color: '#56d364' },
    { name: 'Vishnu Prasad', points: 250, challengesDone: 3, badge: '📝 Apprentice', color: '#f0883e' },
    { name: 'Lakshmi R', points: 220, challengesDone: 3, badge: '📝 Apprentice', color: '#79c0ff' },
    { name: 'Amal Jose', points: 195, challengesDone: 3, badge: '🎯 First Attempt', color: '#da3633' },
    { name: 'Devika M', points: 160, challengesDone: 2, badge: '🎯 First Attempt', color: '#d2a8ff' },
    { name: 'Nikhil Thomas', points: 120, challengesDone: 2, badge: '🎯 First Attempt', color: '#3fb950' },
    { name: 'Fathima Beevi', points: 85, challengesDone: 1, badge: '🎯 First Attempt', color: '#f0883e' },
];

function getRankDisplay(rank: number) {
    if (rank === 1) return <Crown size={18} color="#ffd700" />;
    if (rank === 2) return <Medal size={18} color="#c0c0c0" />;
    if (rank === 3) return <Medal size={18} color="#cd7f32" />;
    return <span style={{ color: 'var(--text-secondary)' }}>{rank}</span>;
}

function getBadgeFromScore(bestScore: number, earnedBadges: string[]) {
    if (earnedBadges.includes('prompt-master')) return '🏆 Prompt Master';
    if (earnedBadges.includes('prompt-engineer')) return '⚙️ Prompt Engineer';
    if (earnedBadges.includes('prompt-apprentice')) return '📝 Apprentice';
    if (bestScore > 0) return '🎯 First Attempt';
    return '—';
}

export default function Leaderboard() {
    const [userPoints, setUserPoints] = useState(0);
    const [userChallenges, setUserChallenges] = useState(0);
    const [userBadge, setUserBadge] = useState('—');
    const [userRank, setUserRank] = useState(0);
    const [leaderboard, setLeaderboard] = useState<
        { name: string; points: number; challengesDone: number; badge: string; color: string; isUser: boolean }[]
    >([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                let points = 0;
                let challenges = 0;
                let bestScore = 0;

                const { forgeLevel, promptProgress } = await getProgress();

                // Prompt Lab scores
                for (const key of Object.keys(promptProgress)) {
                    const p = promptProgress[key] as { bestScore: number; completed: boolean };
                    points += p.bestScore || 0;
                    if (p.completed) challenges++;
                    if (p.bestScore > bestScore) bestScore = p.bestScore;
                }

                // Forge Projects missions
                points += forgeLevel * 50;

                // Badges bonus
                const earnedBadges = await getBadges();
                points += earnedBadges.length * 25;

                const badge = getBadgeFromScore(bestScore, earnedBadges);

                setUserPoints(points);
                setUserChallenges(challenges);
                setUserBadge(badge);

                // Build combined leaderboard
                const currentUser = {
                    name: 'You',
                    points,
                    challengesDone: challenges,
                    badge,
                    color: '#388bfd',
                    isUser: true,
                };

                const all = [
                    ...SIMULATED_USERS.map(u => ({ ...u, isUser: false })),
                    currentUser,
                ].sort((a, b) => b.points - a.points);

                setLeaderboard(all);
                setUserRank(all.findIndex(u => u.isUser) + 1);
            } catch {
                setLeaderboard(SIMULATED_USERS.map(u => ({ ...u, isUser: false })));
            }
        };
        loadData();
    }, []);

    return (
        <div className={styles.leaderboard}>
            {/* Header */}
            <div className={styles.lbHeader}>
                <div className={styles.lbTitle}>
                    <Trophy size={20} color="#ffd700" />
                    <span>Leaderboard</span>
                </div>
                <span className={styles.lbSub}>Updated in real-time from your scores</span>
            </div>

            {/* Points Summary */}
            <div className={styles.pointsSummary}>
                <div className={styles.pointsCard}>
                    <span className={styles.pointsVal} style={{ color: '#58a6ff' }}>{userPoints}</span>
                    <span className={styles.pointsLabel}>Your Points</span>
                </div>
                <div className={styles.pointsCard}>
                    <span className={styles.pointsVal} style={{ color: userRank <= 3 ? '#ffd700' : '#3fb950' }}>
                        #{userRank || '—'}
                    </span>
                    <span className={styles.pointsLabel}>Your Rank</span>
                </div>
                <div className={styles.pointsCard}>
                    <span className={styles.pointsVal} style={{ color: '#d2a8ff' }}>{userChallenges}</span>
                    <span className={styles.pointsLabel}>Challenges Done</span>
                </div>
            </div>

            {/* Rank Table */}
            <table className={styles.rankTable}>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Points</th>
                        <th>Challenges</th>
                        <th>Badge</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, i) => {
                        const rank = i + 1;
                        return (
                            <tr
                                key={entry.name}
                                className={`${styles.rankRow} ${entry.isUser ? styles.currentUser : ''}`}
                            >
                                <td>
                                    <span className={styles.medal}>{getRankDisplay(rank)}</span>
                                </td>
                                <td>
                                    <div className={styles.nameCell}>
                                        <div
                                            className={styles.avatar}
                                            style={{ background: entry.color }}
                                        >
                                            {entry.name.charAt(0)}
                                        </div>
                                        <span>{entry.name}</span>
                                        {entry.isUser && <span className={styles.youTag}>You</span>}
                                    </div>
                                </td>
                                <td className={styles.pointsCell}>{entry.points}</td>
                                <td>{entry.challengesDone}</td>
                                <td className={styles.badgeCell}>{entry.badge}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* How Points Work */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(177, 186, 196, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Star size={14} />
                    How Points Work
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <span><TrendingUp size={12} style={{ marginRight: 4 }} />Prompt Challenge Score → Direct points</span>
                    <span>🔨 Forge Mission Passed → 50 pts</span>
                    <span>🏅 Badge Earned → 25 pts bonus</span>
                </div>
            </div>
        </div>
    );
}
