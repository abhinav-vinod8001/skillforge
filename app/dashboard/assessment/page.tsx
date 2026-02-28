'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BrainCircuit, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { getUserSkills } from '@/utils/convex/db';
import styles from './assessment.module.css';

interface MCQData {
    concept: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export default function AssessmentPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [mcq, setMcq] = useState<MCQData | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Anti-cheat states
    const [cheatDetected, setCheatDetected] = useState(false);
    const [warnings, setWarnings] = useState(0);

    const router = useRouter();

    const loadAssessment = async () => {
        setIsLoading(true);
        setHasSubmitted(false);
        setSelectedIndex(null);
        setCheatDetected(false);

        try {
            const skills = await getUserSkills();
            const res = await fetch('/api/generate-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills }),
            });

            if (!res.ok) throw new Error('Failed to generate theory assessment');

            const data: MCQData = await res.json();
            setMcq(data);
        } catch (error) {
            console.error('Failed to load assessment', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load initial assessment
    useEffect(() => {
        loadAssessment();
    }, []);

    // Anti-Cheat Engine (Inescapable Room)
    useEffect(() => {
        if (isLoading || hasSubmitted || cheatDetected) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerCheatAlarm();
            }
        };

        const handleBlur = () => {
            triggerCheatAlarm();
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault(); // Disable Right-click
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault(); // Disable Copy
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
        };
    }, [isLoading, hasSubmitted, cheatDetected]);

    const triggerCheatAlarm = () => {
        setWarnings(w => w + 1);
        setCheatDetected(true);
    };

    const handleSubmit = () => {
        if (selectedIndex === null) return;
        setHasSubmitted(true);
    };

    if (cheatDetected) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={styles.antiCheatScreen}>
                    <ShieldAlert size={80} color="#f85149" style={{ animation: 'pulse 1s infinite' }} />
                    <h1 className={styles.antiCheatWarning}>Anti-Cheat Violation Detected</h1>
                    <p className={styles.subtitle}>
                        The AI Tribunal noticed you left the assessment window. This violates the inescapable testing protocol designed to ensure you actually know the underlying theory without searching for the answer.
                    </p>
                    <div className={styles.actionGrid} style={{ marginTop: '2rem' }}>
                        <button className="btn-primary" onClick={loadAssessment}>
                            <RefreshCw size={18} /> Re-roll New Question
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={styles.loadingScreen}>
                    <BrainCircuit size={48} className="text-gradient" style={{ animation: 'pulse 2s infinite' }} />
                    <h2 className={styles.loadingText}>Synthesizing Academic Assessment...</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        The AI Examiner is constructing a theoretical prerequisite question to test your fundamental knowledge. Do not leave this tab once it begins.
                    </p>
                </div>
            </div>
        );
    }

    if (hasSubmitted && mcq) {
        const isPass = selectedIndex === mcq.correctIndex;
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={isPass ? styles.successScreen : styles.failScreen}>
                    {isPass ? (
                        <CheckCircle2 size={64} color="#3fb950" style={{ margin: '0 auto 1.5rem' }} />
                    ) : (
                        <XCircle size={64} color="#f85149" style={{ margin: '0 auto 1.5rem' }} />
                    )}

                    <h1 className={styles.title}>
                        {isPass ? 'Theory Verified' : 'Theory Assessment Failed'}
                    </h1>
                    <p className={styles.subtitle}>
                        {isPass
                            ? "You successfully proved your understanding of the foundational math and concepts. Access Granted."
                            : "Your understanding of the fundamental theory is flawed. You must master the math before you can master the code."}
                    </p>

                    <div className={`${styles.feedbackBox} ${isPass ? '' : styles.fail}`}>
                        <div className={styles.feedbackTitle}>
                            <AlertTriangle size={18} />
                            Examiner's Explanation
                        </div>
                        <p className={styles.feedbackText}>{mcq.explanation}</p>
                    </div>

                    <div className={styles.actionGrid}>
                        {isPass ? (
                            <button className="btn-primary" onClick={() => router.push('/dashboard')}>
                                Enter Dashboard <ArrowRight size={18} />
                            </button>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={loadAssessment}>
                                    <RefreshCw size={18} /> Reroll Assessment
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

    if (!mcq) return null;

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Inescapable Theory Screen</h1>
                <p className={styles.subtitle}>
                    Prove your fundamental knowledge. Leaving this tab, switching windows, or trying to copy text will result in an immediate anti-cheat violation.
                </p>
            </div>

            <div className={styles.mcqPanel}>
                <div className={styles.conceptBox}>
                    <span className={styles.conceptLabel}>Prerequisite Concept</span>
                    {mcq.concept}
                </div>

                <div className={styles.question}>
                    {mcq.question}
                </div>

                <div className={styles.optionsGrid}>
                    {mcq.options.map((option, index) => (
                        <button
                            key={index}
                            className={`${styles.optionBtn} ${selectedIndex === index ? styles.selected : ''}`}
                            onClick={() => setSelectedIndex(index)}
                        >
                            <span className={styles.optionIndex}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            {option}
                        </button>
                    ))}
                </div>

                <button
                    className={`btn-primary ${styles.submitBtn}`}
                    onClick={handleSubmit}
                    disabled={selectedIndex === null}
                >
                    Submit Answer
                </button>
            </div>
        </div>
    );
}
