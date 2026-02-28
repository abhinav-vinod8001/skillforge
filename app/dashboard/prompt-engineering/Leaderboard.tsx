'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { getProgress, getBadges, getLeaderboard, syncLeaderboard, LeaderboardEntry } from '@/utils/convex/db';
import styles from './leaderboard.module.css';

function getRankDisplay(rank: number) {
    if (rank === 1) return <Crown size={18} color="#ffd700" />;
    if (rank === 2) return <Medal size={18} color="#c0c0c0" />;
    if (rank === 3) return <Medal size={18} color="#cd7f32" />;
    return <span style={{ color: 'var(--text-secondary)' }}>{rank}</span>;
}

function getBadgeFromScore(earnedBadges: string[]) {
    if (earnedBadges.includes('prompt-master')) return '🏆 Prompt Master';
    if (earnedBadges.includes('prompt-engineer')) return '⚙️ Prompt Engineer';
    if (earnedBadges.includes('prompt-apprentice')) return '📝 Apprentice';
    if (earnedBadges.includes('first-attempt')) return '🎯 First Attempt';
    return '—';
}

const RANK_COLORS = ['#f0883e', '#d2a8ff', '#58a6ff', '#56d364', '#f0883e', '#79c0ff', '#da3633', '#3fb950'];

function getColorForIndex(i: number) {
    return RANK_COLORS[i % RANK_COLORS.length];
}

export default function Leaderboard() {
    const [userPoints, setUserPoints] = useState(0);
    const [userChallenges, setUserChallenges] = useState(0);
    const [userBadge, setUserBadge] = useState('—');
    const [userRank, setUserRank] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [leaderboard, setLeaderboard] = useState<
        { name: string; points: number; challengesDone: number; badge: string; color: string; isUser: boolean; forgeLevel: number }[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // First sync the current user's score to the leaderboard
            await syncLeaderboard();

            // Then fetch the full leaderboard
            const scores: LeaderboardEntry[] = await getLeaderboard();

            // Get current user's ID
            let currentUserId = '';
            try {
                const user = localStorage.getItem('praxis_user');
                if (user) currentUserId = JSON.parse(user).id || '';
            } catch { /* ignore */ }

            // Also compute current user points locally for immediate display
            let myPoints = 0;
            let myChallenges = 0;

            const { forgeLevel, promptProgress } = await getProgress();
            for (const key of Object.keys(promptProgress)) {
                const p = promptProgress[key] as { bestScore: number; completed: boolean };
                myPoints += p.bestScore || 0;
                if (p.completed) myChallenges++;
            }
            myPoints += forgeLevel * 50;
            const earnedBadges = await getBadges();
            myPoints += earnedBadges.length * 25;
            const badge = getBadgeFromScore(earnedBadges);

            setUserPoints(myPoints);
            setUserChallenges(myChallenges);
            setUserBadge(badge);

            // Build the combined leaderboard from real Convex data
            const allEntries = scores.map((entry, i) => ({
                name: entry.userName,
                points: entry.totalPoints,
                challengesDone: entry.challengesDone,
                badge: entry.topBadge,
                color: getColorForIndex(i),
                isUser: entry.userId === currentUserId,
                forgeLevel: entry.forgeLevel,
            })).sort((a, b) => b.points - a.points);

            setLeaderboard(allEntries);
            setTotalUsers(allEntries.length);
            const rank = allEntries.findIndex(u => u.isUser) + 1;
            setUserRank(rank > 0 ? rank : allEntries.length + 1);
        } catch {
            setLeaderboard([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.leaderboard}>
            {/* Header */}
            <div className={styles.lbHeader}>
                <div className={styles.lbTitle}>
                    <Trophy size={20} color="#ffd700" />
                    <span>Leaderboard</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={styles.lbSub}>
                        <Users size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        {totalUsers} registered {totalUsers === 1 ? 'user' : 'users'}
                    </span>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                        }}
                    >
                        <RefreshCw size={12} className={isLoading ? styles.spin : ''} />
                        Refresh
                    </button>
                </div>
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
                <div className={styles.pointsCard}>
                    <span className={styles.pointsVal} style={{ color: '#f0883e', fontSize: '0.9rem' }}>{userBadge}</span>
                    <span className={styles.pointsLabel}>Top Badge</span>
                </div>
            </div>

            {/* Rank Table */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={24} className={styles.spin} />
                    <p style={{ marginTop: '0.5rem' }}>Loading leaderboard...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No scores yet. Complete challenges to appear on the leaderboard!</p>
                </div>
            ) : (
                <table className={styles.rankTable}>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>User</th>
                            <th>Points</th>
                            <th>Challenges</th>
                            <th>Forge</th>
                            <th>Badge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, i) => {
                            const rank = i + 1;
                            return (
                                <tr
                                    key={entry.name + i}
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
                                                {entry.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{entry.name}</span>
                                            {entry.isUser && <span className={styles.youTag}>You</span>}
                                        </div>
                                    </td>
                                    <td className={styles.pointsCell}>{entry.points}</td>
                                    <td>{entry.challengesDone}</td>
                                    <td>{entry.forgeLevel}</td>
                                    <td className={styles.badgeCell}>{entry.badge}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

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
