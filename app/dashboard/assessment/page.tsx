'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BrainCircuit, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { getSyllabus } from '@/utils/convex/db';
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
    const [questions, setQuestions] = useState<MCQData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const [isFullyPassed, setIsFullyPassed] = useState(false);

    // Anti-cheat states
    const [cheatDetected, setCheatDetected] = useState(false);

    const router = useRouter();

    const loadAssessment = async () => {
        setIsLoading(true);
        setHasSubmittedCurrent(false);
        setSelectedIndex(null);
        setCurrentIndex(0);
        setIsFailed(false);
        setIsFullyPassed(false);
        setCheatDetected(false);
        setQuestions([]);

        try {
            const syllabus = await getSyllabus() as Record<string, unknown> | null;
            const current_knowledge = (syllabus?.current_knowledge as string[]) || [];
            const missing_prerequisites = (syllabus?.missing_prerequisites as string[]) || [];

            const res = await fetch('/api/generate-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_knowledge, missing_prerequisites }),
            });

            if (!res.ok) throw new Error('Failed to generate theory assessment sequence');

            const data: MCQData[] = await res.json();
            setQuestions(data);
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
        if (isLoading || isFullyPassed || isFailed || cheatDetected) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setCheatDetected(true);
            }
        };

        const handleBlur = () => {
            setCheatDetected(true);
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
    }, [isLoading, isFullyPassed, isFailed, cheatDetected]);

    const handleSubmit = () => {
        if (selectedIndex === null) return;

        const mcq = questions[currentIndex];
        const isPass = selectedIndex === mcq.correctIndex;

        if (!isPass) {
            setIsFailed(true);
        }
        setHasSubmittedCurrent(true);
    };

    const handleNextPhase = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedIndex(null);
            setHasSubmittedCurrent(false);
        } else {
            setIsFullyPassed(true);
        }
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
                            <RefreshCw size={18} /> Re-roll New Assessment
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
                    <h2 className={styles.loadingText}>Synthesizing Multi-Phase Assessment...</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        The AI Examiner is constructing a chronological 2-stage theoretical question sequence based on your syllabus trajectory. Do not leave this tab once it begins.
                    </p>
                </div>
            </div>
        );
    }

    if (isFullyPassed) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={styles.successScreen}>
                    <CheckCircle2 size={64} color="#3fb950" style={{ margin: '0 auto 1.5rem' }} />
                    <h1 className={styles.title}>Tribunal Cleared</h1>
                    <p className={styles.subtitle}>
                        You successfully proved your understanding of both your existing knowledge bounds and the theoretical prerequisites for your next stage. Access Granted.
                    </p>

                    <div className={styles.actionGrid} style={{ marginTop: '2rem' }}>
                        <button className="btn-primary" onClick={() => router.push('/dashboard')}>
                            Initialize Dashboard <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isFailed && hasSubmittedCurrent) {
        const mcq = questions[currentIndex];
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={styles.failScreen}>
                    <XCircle size={64} color="#f85149" style={{ margin: '0 auto 1.5rem' }} />
                    <h1 className={styles.title}>Theory Assessment Failed Phase {currentIndex + 1}</h1>
                    <p className={styles.subtitle}>
                        Your understanding of the fundamental theory is flawed. You must master the math before you can master the code.
                    </p>

                    <div className={`${styles.feedbackBox} ${styles.fail}`}>
                        <div className={styles.feedbackTitle}>
                            <AlertTriangle size={18} />
                            Examiner&apos;s Explanation
                        </div>
                        <p className={styles.feedbackText}>{mcq.explanation}</p>
                    </div>

                    <div className={styles.actionGrid}>
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
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return null;

    const mcq = questions[currentIndex];

    if (hasSubmittedCurrent && !isFailed) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className={styles.successScreen}>
                    <CheckCircle2 size={64} color="#3fb950" style={{ margin: '0 auto 1.5rem' }} />
                    <h1 className={styles.title}>Phase {currentIndex + 1} Cleared</h1>
                    <p className={styles.subtitle}>Your theoretical insight is sound.</p>

                    <div className={styles.feedbackBox}>
                        <div className={styles.feedbackTitle}>
                            <AlertTriangle size={18} />
                            Examiner&apos;s Note
                        </div>
                        <p className={styles.feedbackText}>{mcq.explanation}</p>
                    </div>

                    <div className={styles.actionGrid} style={{ marginTop: '2rem' }}>
                        <button className="btn-primary" onClick={handleNextPhase}>
                            {currentIndex < questions.length - 1 ? `Proceed to Phase ${currentIndex + 2}` : "Finalize Assessment"} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Stage {currentIndex + 1} Query</h1>
                <p className={styles.subtitle}>
                    {currentIndex === 0 ? "Analyzing bounds of your CURRENT knowledge." : "Testing your theoretical aptitude for your MISSING PREREQUISITES."}
                    <br />
                    <span style={{ color: '#f85149', fontWeight: 'bold' }}>Inescapable Theory Screen: Leaving this tab will trigger an anti-cheat violation.</span>
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
                    Submit Phase Answer
                </button>
            </div>
        </div>
    );
}
