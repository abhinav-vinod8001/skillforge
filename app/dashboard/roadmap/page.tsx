'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Map, Loader2, CheckCircle2, ChevronRight, PlayCircle, BookOpen, Code2, RefreshCw, AlertCircle } from 'lucide-react';
import { getSkills, getRoadmap, saveRoadmap, deleteRoadmap } from '@/utils/convex/db';
import styles from './roadmap.module.css';

interface RoadmapData {
    focus_trend: string;
    reason: string;
    weeks: {
        week: number;
        title: string;
        description: string;
        resource: string;
        action_item: string;
    }[];
    capstone_project: {
        name: string;
        description: string;
    };
}

interface Trend {
    skill_name: string;
    growth_percentage: number;
    demand_level: string;
    context: string;
}

const FALLBACK_TRENDS: Trend[] = [
    { skill_name: 'Agentic AI', growth_percentage: 45, demand_level: 'High', context: 'High demand in enterprise automation' },
    { skill_name: 'Rust', growth_percentage: 30, demand_level: 'Medium', context: 'Systems programming and WebAssembly' },
    { skill_name: 'DevSecOps', growth_percentage: 35, demand_level: 'High', context: 'Security shift-left demand' },
    { skill_name: 'LLM Fine-tuning', growth_percentage: 50, demand_level: 'High', context: 'Custom AI model development' },
    { skill_name: 'Platform Engineering', growth_percentage: 28, demand_level: 'Medium', context: 'Internal developer platforms' },
];

export default function RoadmapPage() {
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const router = useRouter();

    const getUserSkills = async (): Promise<string[]> => {
        try {
            const skills = await getSkills();
            if (skills.length > 0) return skills;
        } catch { /* ignore */ }
        return [];
    };

    const fetchLiveTrends = async (userSkills: string[]): Promise<Trend[]> => {
        try {
            // Try cached trends first
            const cached = localStorage.getItem('skillforge_trends_cache');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Use cache if it's less than 30 minutes old
                if (Date.now() - timestamp < 30 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
                    return data;
                }
            }
            // Fetch fresh personalized trends
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: userSkills }),
            });
            if (!res.ok) throw new Error('Trends API failed');
            const json = await res.json();
            const trends: Trend[] = json.trends || [];
            if (trends.length > 0) {
                localStorage.setItem('skillforge_trends_cache', JSON.stringify({ data: trends, timestamp: Date.now() }));
                return trends;
            }
        } catch {
            console.warn('Could not fetch personalized live trends, using fallback.');
        }
        return FALLBACK_TRENDS;
    };

    const generateRoadmap = useCallback(async () => {
        setGenerating(true);
        setError(null);

        try {
            const skills = await getUserSkills();

            setStatusMessage('Scanning live market trends...');
            const trends = await fetchLiveTrends(skills);

            if (skills.length === 0) {
                setStatusMessage('No syllabus found, generating a general roadmap...');
            } else {
                setStatusMessage(`Building your personalized roadmap for ${skills.length} skills...`);
            }

            const skillsToSend = skills.length > 0
                ? skills
                : ['Problem Solving', 'Basic Programming', 'Logical Thinking'];

            const res = await fetch('/api/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: skillsToSend,
                    trends: trends.slice(0, 8), // send top 8 trends
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${res.status}`);
            }

            const newRoadmap: RoadmapData = await res.json();

            // Validate structure
            if (!newRoadmap.focus_trend || !Array.isArray(newRoadmap.weeks)) {
                throw new Error('Invalid roadmap structure received from AI.');
            }

            await saveRoadmap(newRoadmap as any);
            setRoadmap(newRoadmap);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error occurred.';
            console.error('Roadmap generation failed:', msg);
            setError(msg);
        } finally {
            setGenerating(false);
            setStatusMessage('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadExisting = async () => {
            const saved = await getRoadmap();
            if (saved && (saved as any).focus_trend && Array.isArray((saved as any).weeks)) {
                setRoadmap(saved as any);
                setLoading(false);
                return;
            }
            // No valid saved roadmap — auto-generate
            setLoading(false);
            generateRoadmap();
        };
        loadExisting();
    }, [generateRoadmap]);

    const handleRegenerate = async () => {
        await deleteRoadmap();
        setRoadmap(null);
        generateRoadmap();
    };

    // ── Loading / Generating State ──────────────────────────────────────────
    if (loading || generating) {
        return (
            <div className={styles.centered}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-purple)' }} />
                <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {statusMessage || 'Loading your roadmap...'}
                </p>
            </div>
        );
    }

    // ── Error State ─────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className={`animate-fade-in ${styles.emptyState}`}>
                <AlertCircle size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: '#f85149' }} />
                <h1 className={styles.title}>Generation Failed</h1>
                <p className={styles.subtitle} style={{ color: '#f85149' }}>{error}</p>
                <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
                    Make sure you have uploaded your syllabus first.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                    <button onClick={handleRegenerate} className="btn-primary">
                        <RefreshCw size={18} /> Try Again
                    </button>
                    <button onClick={() => router.push('/dashboard/onboarding')} className="btn-glass">
                        Upload Syllabus First
                    </button>
                </div>
            </div>
        );
    }

    // ── Empty / No Roadmap ──────────────────────────────────────────────────
    if (!roadmap) {
        return (
            <div className={`animate-fade-in ${styles.emptyState}`}>
                <Map size={64} className="text-gradient" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h1 className={styles.title}>No Roadmap Found</h1>
                <p className={styles.subtitle}>Let our AI analyze your skills against the market to forge your path.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                    <button onClick={handleRegenerate} className="btn-primary" disabled={generating}>
                        {generating ? <><Loader2 className="animate-spin" size={18} /> Forging Path...</> : 'Generate My Forge Path'}
                    </button>
                    <button onClick={() => router.push('/dashboard/onboarding')} className="btn-glass">
                        Upload Syllabus First
                    </button>
                </div>
            </div>
        );
    }

    // ── Roadmap Display ─────────────────────────────────────────────────────
    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        Your Forge Path: <span className="text-gradient">{roadmap.focus_trend}</span>
                    </h1>
                    <p className={styles.subtitle}>{roadmap.reason}</p>
                </div>
                <button
                    onClick={handleRegenerate}
                    className="btn-glass"
                    title="Regenerate roadmap"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} /> Regenerate
                </button>
            </div>

            <div className={styles.timeline}>
                {roadmap.weeks && Array.isArray(roadmap.weeks) ? roadmap.weeks.map((week, idx) => (
                    <div key={idx} className={`glass-panel ${styles.weekCard}`} style={{ animationDelay: `${idx * 0.15}s` }}>
                        <div className={styles.weekNumber}>Week {week.week}</div>
                        <div className={styles.weekContent}>
                            <h3>{week.title}</h3>
                            <p className={styles.weekDesc}>{week.description}</p>

                            <div className={styles.actionItems}>
                                <div className={styles.actionItem}>
                                    <BookOpen size={16} className="text-gradient" />
                                    <span>{week.resource}</span>
                                </div>
                                <div className={styles.actionItem}>
                                    <CheckCircle2 size={16} className="text-gradient" />
                                    <span>{week.action_item}</span>
                                </div>
                            </div>
                        </div>
                        {week.week === 4 && (
                            <button onClick={() => router.push('/dashboard/project')} className="btn-primary" style={{ flexShrink: 0, alignSelf: 'center' }}>
                                Build Capstone <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                )) : (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>No weekly roadmap data was generated. Please try again.</p>
                        <button onClick={handleRegenerate} className="btn-primary" style={{ marginTop: '1rem' }}>
                            <RefreshCw size={16} /> Retry
                        </button>
                    </div>
                )}
            </div>

            {roadmap.capstone_project && (
                <div className={`glass-panel ${styles.capstoneCard}`}>
                    <div className={styles.capstoneHeader}>
                        <Code2 size={24} className="text-gradient" />
                        <h2>Capstone Project</h2>
                    </div>
                    <div className={styles.capstoneContent}>
                        <h3>{roadmap.capstone_project.name}</h3>
                        <p>{roadmap.capstone_project.description}</p>
                        <div className={styles.capstoneActions}>
                            <button onClick={() => router.push('/dashboard/project')} className="btn-primary">
                                Launch Blueprint Editor
                            </button>
                            <button onClick={() => router.push('/dashboard/simulator')} className="btn-glass">
                                <PlayCircle size={18} /> Enter Internship Simulator
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
