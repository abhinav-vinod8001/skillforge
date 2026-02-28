'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { Loader2, Code2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { getUserSkills } from '@/utils/convex/db';
import styles from './assessment.module.css';

interface AssessmentData {
    language: string;
    concept: string;
    instructions: string;
    buggyCode: string;
}

export default function AssessmentPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [assessment, setAssessment] = useState<AssessmentData | null>(null);
    const [userCode, setUserCode] = useState('');
    const [result, setResult] = useState<{ pass: boolean; feedback: string; missingPrerequisite: string | null } | null>(null);

    const router = useRouter();

    const loadAssessment = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const skills = await getUserSkills();
            const res = await fetch('/api/generate-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills }),
            });

            if (!res.ok) throw new Error('Failed to generate assessment');

            const data: AssessmentData = await res.json();
            setAssessment(data);
            setUserCode(data.buggyCode);
        } catch (error) {
            console.error('Failed to load assessment', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssessment();
    }, []);

    const handleSubmit = async () => {
        if (!assessment) return;
        setIsEvaluating(true);

        try {
            const res = await fetch('/api/evaluate-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalCode: assessment.buggyCode,
                    userCode,
                    concept: assessment.concept,
                    language: assessment.language,
                }),
            });

            if (!res.ok) throw new Error('Evaluation failed');

            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsEvaluating(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={styles.loadingScreen}>
                    <Code2 size={48} className="text-gradient" style={{ animation: 'pulse 2s infinite' }} />
                    <h2 className={styles.loadingText}>Generating your Cheat-Proof Pre-Assessment...</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        The AI Tribunal is building a dynamic coding sandbox to test your prerequisite skills.
                    </p>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={result.pass ? styles.successScreen : styles.failScreen}>
                    {result.pass ? (
                        <CheckCircle2 size={64} color="#3fb950" style={{ margin: '0 auto 1.5rem' }} />
                    ) : (
                        <XCircle size={64} color="#f85149" style={{ margin: '0 auto 1.5rem' }} />
                    )}

                    <h1 className={styles.title}>
                        {result.pass ? 'Assessment Passed' : 'Assessment Failed'}
                    </h1>
                    <p className={styles.subtitle}>
                        {result.pass
                            ? "You successfully proved your fundamental skills. The AI Tribunal has authorized your entry to SkillForge."
                            : "The AI Tribunal detected a structural failure in your code fix. You are missing core prerequisites."}
                    </p>

                    <div className={`${styles.feedbackBox} ${result.pass ? '' : styles.fail}`}>
                        <div className={styles.feedbackTitle}>
                            <AlertTriangle size={18} />
                            Tribunal Feedback
                        </div>
                        <p className={styles.feedbackText}>{result.feedback}</p>

                        {!result.pass && result.missingPrerequisite && (
                            <div className={styles.prereqBox}>
                                <span className={styles.prereqLabel}>Missing Prerequisite Detected:</span>
                                <div>{result.missingPrerequisite}</div>
                            </div>
                        )}
                    </div>

                    <div className={styles.actionGrid}>
                        {result.pass ? (
                            <button className="btn-primary" onClick={() => router.push('/dashboard')}>
                                Enter Dashboard <ArrowRight size={18} />
                            </button>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={loadAssessment}>
                                    <RefreshCw size={18} /> Try Another Problem
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => router.push('/dashboard')}
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'transparent' }}
                                >
                                    Force Enter Anyway <ArrowRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!assessment) return null;

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Skill Scanner Engine</h1>
                <p className={styles.subtitle}>Prove your claimed skills. Fix the single logical bug in the snippet below to pass the AI Tribunal's prerequisite check.</p>
            </div>

            <div className={styles.workspace}>
                <div className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <span>assessment.test</span>
                        <span className={styles.languageBadge}>{assessment.language}</span>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Editor
                            height="100%"
                            language={assessment.language.toLowerCase() === 'python' ? 'python' : assessment.language.toLowerCase() === 'sql' ? 'sql' : 'javascript'}
                            theme="vs-dark"
                            value={userCode}
                            onChange={(val) => setUserCode(val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                </div>

                <div className={styles.taskPanel}>
                    <h2 className={styles.taskTitle}>
                        <Code2 size={20} className="text-gradient" />
                        Mission Briefing
                    </h2>

                    <div className={styles.conceptBox}>
                        <span className={styles.conceptLabel}>Target Concept</span>
                        {assessment.concept}
                    </div>

                    <div className={styles.instructions}>
                        {assessment.instructions}
                    </div>

                    <button
                        className={`btn-primary ${styles.submitBtn}`}
                        onClick={handleSubmit}
                        disabled={isEvaluating}
                    >
                        {isEvaluating ? (
                            <><Loader2 className="animate-spin" size={18} /> Analyzing Fix...</>
                        ) : (
                            <><CheckCircle2 size={18} /> Submit Fix for Evaluation</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
