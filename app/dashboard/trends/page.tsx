'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowRight, Activity, Zap } from 'lucide-react';
import { getUserSkills } from '@/utils/convex/db';
import styles from './trends.module.css';

interface Trend {
    skill_name: string;
    growth_percentage: number;
    demand_level: string;
    context: string;
}

export default function TrendsPage() {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchTrends = async () => {
        setLoading(true);
        try {
            // Get user's current skills to personalize the trends
            const userSkills = await getUserSkills();

            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: userSkills }),
            });
            const data = await res.json();
            const currentTrends: Trend[] = data.trends || [];
            setTrends(currentTrends);

            // Cache trends so the roadmap page can use them without re-fetching
            if (currentTrends.length > 0) {
                localStorage.setItem('skillforge_trends_cache', JSON.stringify({
                    data: currentTrends,
                    timestamp: Date.now(),
                }));
            }
        } catch {
            console.error("Failed to load trends");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, []);

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Personalized Market Trends</h1>
                    <p className={styles.subtitle}>AI-curated analysis of booming tech skills actively hiring related to your learning focus.</p>
                </div>
                <button
                    onClick={fetchTrends}
                    disabled={loading}
                    className={`btn-glass ${styles.refreshBtn}`}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Analyzing...' : 'Refresh Trends'}
                </button>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <Activity size={48} className="text-gradient animate-pulse" style={{ margin: '0 auto 1rem' }} />
                        <p>Aggregating market demand & scraping tech boards...</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Focus Skill</th>
                                <th>Growth</th>
                                <th>Demand Level</th>
                                <th>Context</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trends.map((trend, i) => (
                                <tr key={i} style={{ animationDelay: `${i * 0.1}s` }} className="animate-fade-in">
                                    <td className={styles.skillName}>
                                        <Zap size={16} className="text-gradient" /> {trend.skill_name}
                                    </td>
                                    <td>
                                        <span className={styles.growthBadge}>+{trend.growth_percentage}%</span>
                                    </td>
                                    <td>
                                        <span className={`${styles.demandBadge} ${styles[trend.demand_level.toLowerCase()] || styles.medium}`}>
                                            {trend.demand_level}
                                        </span>
                                    </td>
                                    <td className={styles.contextInfo}>{trend.context}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && (
                <div className={styles.actionFooter}>
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Ready to bridge the gap?</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Use these insights combined with your syllabus to build a custom Forge Path.</p>
                        </div>
                        <button onClick={() => router.push('/dashboard/roadmap')} className="btn-primary">
                            Generate My Forge Path <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
