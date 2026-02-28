'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Map, Loader2, CheckCircle2, ChevronRight, PlayCircle, BookOpen, Code2 } from 'lucide-react';
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

export default function RoadmapPage() {
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchSavedRoadmap();
    }, []);

    const fetchSavedRoadmap = async () => {
        setLoading(true);
        const stored = localStorage.getItem('skillforge_roadmap');
        if (stored) {
            try {
                setRoadmap(JSON.parse(stored));
            } catch {
                console.error('Invalid roadmap data in localStorage, clearing.');
                localStorage.removeItem('skillforge_roadmap');
            }
        }
        setLoading(false);
    };

    const generateRoadmap = async () => {
        setGenerating(true);
        try {
            let skills: string[];
            try {
                skills = JSON.parse(localStorage.getItem('skillforge_skills') || '["Basic Programming"]');
            } catch {
                skills = ['Basic Programming'];
            }

            // Use static fallback trends since Supabase auth is bypassed
            const trends = [
                { skill_name: "Agentic AI", growth_percentage: 45, demand_level: "High", context: "High demand in enterprise" },
                { skill_name: "Rust", growth_percentage: 30, demand_level: "Medium", context: "Systems programming safety" },
                { skill_name: "DevSecOps", growth_percentage: 35, demand_level: "High", context: "Security shift-left demand" },
            ];

            const res = await fetch('/api/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills, trends })
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const newRoadmap = await res.json();

            // Save it
            localStorage.setItem('skillforge_roadmap', JSON.stringify(newRoadmap));

            setRoadmap(newRoadmap);
        } catch (error) {
            console.error("Failed to generate roadmap", error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return <div className={styles.centered}><Loader2 className="animate-spin text-gradient" size={48} /></div>;
    }

    if (!roadmap) {
        return (
            <div className={`animate-fade-in ${styles.emptyState}`}>
                <Map size={64} className="text-gradient" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h1 className={styles.title}>No Roadmap Found</h1>
                <p className={styles.subtitle}>Let our AI analyze your skills against the market to forge your path.</p>
                <button onClick={generateRoadmap} className="btn-primary" disabled={generating} style={{ marginTop: '2rem' }}>
                    {generating ? <><Loader2 className="animate-spin" size={18} /> Forging Path...</> : 'Generate My Forge Path'}
                </button>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Your Forge Path: <span className="text-gradient">{roadmap.focus_trend}</span></h1>
                <p className={styles.subtitle}>{roadmap.reason}</p>
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
                        <p>No weekly roadmap data was generated. Please try forging a path again.</p>
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
