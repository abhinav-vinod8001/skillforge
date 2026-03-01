'use client';

import { useState } from 'react';
import { Loader2, Coffee, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './simulator.module.css';

interface StandupModalProps {
    onComplete: (score: number) => void;
}

interface StandupFeedback {
    passed: boolean;
    score: number;
    feedback: string;
    clarity?: number;
    realism?: number;
    communication?: number;
}

export default function StandupModal({ onComplete }: StandupModalProps) {
    const [yesterday, setYesterday] = useState('');
    const [today, setToday] = useState('');
    const [blockers, setBlockers] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<StandupFeedback | null>(null);

    const handleSubmit = async () => {
        if (!yesterday.trim() || !today.trim()) return;
        setLoading(true);

        try {
            const standupText = `Yesterday: ${yesterday}\nToday: ${today}\nBlockers: ${blockers || 'None'}`;
            const res = await fetch('/api/simulator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: standupText }],
                    type: 'standup',
                }),
            });
            const data = await res.json();
            let parsed: StandupFeedback = { passed: true, score: 20, feedback: 'Good standup!' };
            try { parsed = JSON.parse(data.content) as StandupFeedback; } catch { }
            setFeedback(parsed);
        } catch {
            setFeedback({ passed: true, score: 20, feedback: 'Evaluation failed. Proceeding to workspace.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.standupOverlay}
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`glass-panel ${styles.standupModal}`}
            >
                <div className={styles.standupHeader}>
                    <Coffee size={32} className="text-gradient" />
                    <h2>Daily Standup</h2>
                    <p>Before starting your shift, brief your team on your status.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!feedback ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.standupForm}
                        >
                            <div className={styles.standupField}>
                                <label>
                                    <span className={styles.standupLabel}>Yesterday</span>
                                    <span className={styles.standupHint}>What did you accomplish?</span>
                                </label>
                                <textarea
                                    value={yesterday}
                                    onChange={e => setYesterday(e.target.value)}
                                    placeholder='e.g., "Set up dev environment, reviewed PR #42, fixed the auth redirect bug"'
                                    rows={2}
                                    className={styles.standupTextarea}
                                />
                            </div>
                            <div className={styles.standupField}>
                                <label>
                                    <span className={styles.standupLabel}>Today</span>
                                    <span className={styles.standupHint}>What do you plan to work on?</span>
                                </label>
                                <textarea
                                    value={today}
                                    onChange={e => setToday(e.target.value)}
                                    placeholder='e.g., "Tackle TICKET-003 (P1 bug), start on the settings page feature"'
                                    rows={2}
                                    className={styles.standupTextarea}
                                />
                            </div>
                            <div className={styles.standupField}>
                                <label>
                                    <span className={styles.standupLabel}>Blockers</span>
                                    <span className={styles.standupHint}>Anything preventing progress? (optional)</span>
                                </label>
                                <textarea
                                    value={blockers}
                                    onChange={e => setBlockers(e.target.value)}
                                    placeholder='e.g., "Waiting on API docs from backend team" or "None"'
                                    rows={2}
                                    className={styles.standupTextarea}
                                />
                            </div>
                            <button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={loading || !yesterday.trim() || !today.trim()}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                {loading ? <><Loader2 className="animate-spin" size={18} /> Evaluating Standup...</> : 'Submit Standup'}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.standupFeedback}
                        >
                            <div className={styles.standupResultIcon}>
                                {feedback.passed ? (
                                    <CheckCircle2 size={48} color="#34d399" />
                                ) : (
                                    <XCircle size={48} color="#f87171" />
                                )}
                            </div>
                            <h3>{feedback.passed ? 'Great Standup!' : 'Needs Improvement'}</h3>
                            <p className={styles.standupFeedbackText}>{feedback.feedback}</p>

                            <div className={styles.standupScores}>
                                <div className={styles.standupScoreItem}>
                                    <span>Clarity</span>
                                    <strong>{feedback.clarity || '—'}/10</strong>
                                </div>
                                <div className={styles.standupScoreItem}>
                                    <span>Realism</span>
                                    <strong>{feedback.realism || '—'}/10</strong>
                                </div>
                                <div className={styles.standupScoreItem}>
                                    <span>Communication</span>
                                    <strong>{feedback.communication || '—'}/10</strong>
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={() => onComplete(feedback.score || 20)}
                                style={{ width: '100%', marginTop: '1.5rem' }}
                            >
                                {feedback.passed ? 'Enter Workspace' : 'Enter Workspace Anyway'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
