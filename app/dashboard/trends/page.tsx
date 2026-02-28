'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowRight, Activity, Zap } from 'lucide-react';
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
            const res = await fetch('/api/scrape');
            const data = await res.json();
            const currentTrends = data.trends || [];
            setTrends(currentTrends);
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
                    <h1 className={styles.title}>Live Market Trends</h1>
                    <p className={styles.subtitle}>Real-time analysis of in-demand skills actively hiring right now.</p>
                </div>
                <button
                    onClick={fetchTrends}
                    disabled={loading}
                    className={`btn-glass ${styles.refreshBtn}`}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Scanning...' : 'Scan Market'}
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
