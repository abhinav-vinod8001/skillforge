'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Map, Loader2, CheckCircle2, ChevronRight, PlayCircle, BookOpen, Code2, AlertCircle, RefreshCw, Zap, TrendingUp, Target, ArrowLeft } from 'lucide-react';
import { getSyllabus, getChapter, saveChapter, markModuleComplete } from '@/utils/convex/db';
import ReactMarkdown from 'react-markdown';
import styles from './roadmap.module.css';

interface SyllabusNode {
    phase: number;
    title: string;
    description: string;
    milestone: string;
}

interface Capstone {
    name: string;
    description: string;
}

interface SyllabusData {
    summary: string;
    current_knowledge?: string[];
    missing_prerequisites?: string[];
    industry_trends?: string[];
    skills: string[];
    nodes: SyllabusNode[];
    capstone: Capstone;
}

export default function RoadmapPage() {
    const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activePhase, setActivePhase] = useState<SyllabusNode | null>(null);
    const [chapterContent, setChapterContent] = useState<string | null>(null);
    const [chapterLoading, setChapterLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadSyllabus = async () => {
            try {
                const data = await getSyllabus();
                if (data && (data as Record<string, unknown>).nodes) {
                    setSyllabus(data as unknown as SyllabusData);
                }
            } catch (err) {
                console.error("Failed to load syllabus:", err);
            } finally {
                setLoading(false);
            }
        };
        loadSyllabus();
    }, []);

    const handlePhaseClick = async (node: SyllabusNode) => {
        setActivePhase(node);
        setChapterContent(null);
        setChapterLoading(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // 1. Try Cache/DB
            const existing = await getChapter(node.phase);
            if (existing) {
                setChapterContent(existing);
                setChapterLoading(false);
                return;
            }

            // 2. Generate new chapter
            const res = await fetch('/api/generate-chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: node.title,
                    description: node.description,
                    milestone: node.milestone
                })
            });

            if (!res.ok) throw new Error("Failed to compile chapter");
            const data = await res.json();

            // 3. Save and render
            await saveChapter(node.phase, data.content);
            setChapterContent(data.content);
        } catch (error) {
            console.error("Chapter generation failed:", error);
            setChapterContent("## Error\nFailed to load chapter content. Please try again.");
        } finally {
            setChapterLoading(false);
        }
    };

    // ── Loading State ──────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.centered}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-purple)' }} />
                <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Loading your personalized syllabus...
                </p>
            </div>
        );
    }

    // ── Empty / No Syllabus ──────────────────────────────────────────────────
    if (!syllabus) {
        return (
            <div className={`animate-fade-in ${styles.emptyState}`}>
                <Map size={64} className="text-gradient" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h1 className={styles.title}>No Syllabus Found</h1>
                <p className={styles.subtitle}>Let our AI analyze your skills against the market to forge your path.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                    <button onClick={() => router.push('/dashboard/onboarding')} className="btn-primary">
                        Configure My Trajectory
                    </button>
                </div>
            </div>
        );
    }

    // ── Roadmap Display ─────────────────────────────────────────────────────

    if (activePhase) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <button
                    onClick={() => setActivePhase(null)}
                    className="btn-glass"
                    style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} /> Back to Roadmap
                </button>
                <div className="glass-panel" style={{ padding: '3rem 2.5rem', minHeight: '60vh' }}>
                    {chapterLoading ? (
                        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-purple)', margin: '0 auto' }} />
                            <h2 style={{ marginTop: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Forging Educational Node...</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
                                Our AI is synthesizing a highly-detailed tutorial for Phase {activePhase.phase}: {activePhase.title}
                            </p>
                        </div>
                    ) : (
                        <div className={`animate-fade-in ${styles.markdownWrapper}`}>
                            <ReactMarkdown>{chapterContent || ''}</ReactMarkdown>

                            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>Understanding Confirmed?</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Log this phase as completed to advance your Praxis certification criteria.</p>
                                <button
                                    className="btn-primary"
                                    onClick={async () => {
                                        await markModuleComplete(activePhase.phase);
                                        setActivePhase(null);
                                    }}
                                >
                                    <CheckCircle2 size={18} /> Mark Phase as Complete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        Your <span className="text-gradient">Engineering Syllabus</span>
                    </h1>
                    <p className={styles.subtitle}>{syllabus.summary}</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/onboarding')}
                    className="btn-glass"
                    title="Reconfigure Trajectory"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} /> Reconfigure
                </button>
            </div>

            {/* Knowledge Gap & Industry Trends Section */}
            <div className={styles.insightsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>

                {syllabus.missing_prerequisites && syllabus.missing_prerequisites.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ff7b72' }}>
                            <AlertCircle size={20} /> Missing Prerequisites
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Concepts you must master before tackling your main target skills.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {syllabus.missing_prerequisites.map((req, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.95rem' }}>
                                    <div style={{ marginTop: '3px', color: '#ff7b72' }}>•</div> {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {syllabus.industry_trends && syllabus.industry_trends.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#79c0ff' }}>
                            <TrendingUp size={20} /> Industry Trends
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Relevant technologies gaining traction in your target field.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {syllabus.industry_trends.map((trend, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.95rem' }}>
                                    <div style={{ marginTop: '3px', color: '#79c0ff' }}>•</div> {trend}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#d2a8ff' }}>
                        <Target size={20} /> Target Skills
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        The core techstack this syllabus is designed to teach you.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {syllabus.skills.map((skill, i) => (
                            <span key={i} style={{ background: 'rgba(210, 168, 255, 0.1)', color: '#d2a8ff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid rgba(210, 168, 255, 0.2)' }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

            </div>

            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Chronological Path</h2>
            <div className={styles.timeline}>
                {syllabus.nodes && Array.isArray(syllabus.nodes) ? syllabus.nodes.map((node, idx) => (
                    <div
                        key={idx}
                        className={`glass-panel ${styles.weekCard}`}
                        style={{ animationDelay: `${idx * 0.15}s`, cursor: 'pointer', transition: 'transform 0.2sease, border-color 0.2s ease' }}
                        onClick={() => handlePhaseClick(node)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(8px)';
                            e.currentTarget.style.borderColor = 'rgba(210, 168, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <div className={styles.weekNumber}>Phase {node.phase}</div>
                        <div className={styles.weekContent}>
                            <h3>{node.title}</h3>
                            <p className={styles.weekDesc}>{node.description}</p>

                            <div className={styles.actionItems}>
                                <div className={styles.actionItem}>
                                    <CheckCircle2 size={16} className="text-gradient" />
                                    <span><strong>Milestone:</strong> {node.milestone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : null}
            </div>

            {
                syllabus.capstone && (
                    <div className={`glass-panel ${styles.capstoneCard}`}>
                        <div className={styles.capstoneHeader}>
                            <Code2 size={24} className="text-gradient" />
                            <h2>Capstone Project</h2>
                        </div>
                        <div className={styles.capstoneContent}>
                            <h3>{syllabus.capstone.name}</h3>
                            <p>{syllabus.capstone.description}</p>
                            <div className={styles.capstoneActions}>
                                <button onClick={() => router.push('/dashboard/simulator')} className="btn-primary">
                                    <PlayCircle size={18} style={{ marginRight: '0.5rem' }} /> Enter Simulator
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
