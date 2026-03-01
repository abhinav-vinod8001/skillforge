'use client';

import { useState } from 'react';
import { Loader2, MessageSquare, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './simulator.module.css';

interface SprintRetroProps {
    baseMetrics: Record<string, number | string> | null;
    standupScore: number;
    ticketsCompleted: number;
    onComplete: (finalMetrics: RetroMetrics) => void;
}

interface RetroParsed {
    feedback?: string;
    self_awareness?: number | string;
    growth_mindset?: number | string;
    specificity?: number | string;
}

interface RetroMetrics {
    score: number;
    [key: string]: string | number | undefined;
}

export default function SprintRetro({ baseMetrics, standupScore, ticketsCompleted, onComplete }: SprintRetroProps) {
    const [wentWell, setWentWell] = useState('');
    const [challenging, setChallenging] = useState('');
    const [doDifferently, setDoDifferently] = useState('');
    const [loading, setLoading] = useState(false);
    const [retroResult, setRetroResult] = useState<{ parsed: RetroParsed, finalMetrics: RetroMetrics } | null>(null);

    const handleSubmit = async () => {
        if (!wentWell.trim() || !challenging.trim() || !doDifferently.trim()) return;
        setLoading(true);

        try {
            const retroText = `What went well: ${wentWell}\nWhat was challenging: ${challenging}\nWhat I would do differently: ${doDifferently}`;

            // ─── CHEAT ENGINE INTERCEPTION ───────────────────────── //
            const cheatRes = await fetch('/api/detect-cheat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: retroText })
            });
            const cheatData = await cheatRes.json();

            if (cheatData.isCheat) {
                alert(`🚨 CHEAT DETECTED by AI Tribunal 🚨\n\nYour reflection appears to be AI-generated.\nReason: ${cheatData.reason}\n\nTo pass the internship, you must write an authentic human reflection.`);
                setLoading(false);
                return;
            }
            // ──────────────────────────────────────────────────────── //

            const res = await fetch('/api/simulator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: retroText }],
                    type: 'retro',
                }),
            });
            const data = await res.json();
            let parsed: { total?: number; self_awareness?: number; growth_mindset?: number; specificity?: number; feedback?: string } = { self_awareness: 7, growth_mindset: 7, specificity: 7, total: 21, feedback: 'Good retrospective.' };
            try { parsed = JSON.parse(data.content); } catch { }

            // Calculate combined final score mathematically capped at 100
            const technicalScore = (baseMetrics?.score as number) || 70;
            const retroScore = parsed.total || 21;

            // Weights: Tech (40%), Retro (20%), Standup (20%), Tickets (20% max)
            const combinedScore = Math.round(
                (technicalScore * 0.4) +
                ((retroScore / 30) * 20) +
                ((standupScore / 30) * 20) +
                Math.min(ticketsCompleted * 5, 20)
            );

            const finalMetrics = {
                ...baseMetrics,
                score: Math.min(combinedScore, 100),
                standup_score: standupScore,
                retro_score: retroScore,
                tickets_completed: ticketsCompleted,
                self_awareness: parsed.self_awareness,
                growth_mindset: parsed.growth_mindset,
                specificity: parsed.specificity,
                retro_feedback: parsed.feedback,
            };

            setRetroResult({ parsed, finalMetrics });
        } catch {
            const fallbackMetrics = {
                ...baseMetrics,
                score: (baseMetrics?.score as number) || 70,
                standup_score: standupScore,
                tickets_completed: ticketsCompleted,
            };
            setRetroResult({ parsed: { feedback: 'Evaluation failed.' }, finalMetrics: fallbackMetrics });
        } finally {
            setLoading(false);
        }
    };

    if (retroResult) {
        const { parsed, finalMetrics } = retroResult;
        const finalScore = finalMetrics.score as number;
        const isPass = finalScore >= 70;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-panel ${styles.retroResult}`}
                style={{ border: isPass ? '1px solid rgba(63, 185, 80, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}
            >
                {isPass ?
                    <Trophy size={48} style={{ color: '#3fb950', margin: '0 auto 1.5rem', display: 'block' }} /> :
                    <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1.5rem', color: '#ef4444' }}>⚠️</div>
                }

                <h2 style={{ color: isPass ? '#3fb950' : '#ef4444' }}>
                    {isPass ? 'Sprint Passed!' : 'Sprint Failed'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {isPass
                        ? (parsed.feedback || 'Excellent work. You passed the 70 point threshold.')
                        : "You scored below the 70 point threshold. You must retake the internship to earn organizational certification."}
                </p>

                <div className={styles.retroScoreGrid}>
                    <div className={styles.retroScoreItem}>
                        <span>Final Score</span>
                        <strong style={{ color: isPass ? '#3fb950' : '#ef4444' }}>{finalScore}/100</strong>
                    </div>
                    <div className={styles.retroScoreItem}>
                        <span>Standup</span>
                        <strong>{standupScore}/30</strong>
                    </div>
                    <div className={styles.retroScoreItem}>
                        <span>Tickets Done</span>
                        <strong>{ticketsCompleted}</strong>
                    </div>
                    <div className={styles.retroScoreItem}>
                        <span>Self-Awareness</span>
                        <strong>{parsed.self_awareness || '—'}/10</strong>
                    </div>
                    <div className={styles.retroScoreItem}>
                        <span>Growth Mindset</span>
                        <strong>{parsed.growth_mindset || '—'}/10</strong>
                    </div>
                    <div className={styles.retroScoreItem}>
                        <span>Specificity</span>
                        <strong>{parsed.specificity || '—'}/10</strong>
                    </div>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => onComplete(finalMetrics)}
                    style={{
                        width: '100%',
                        marginTop: '2rem',
                        background: isPass ? '' : 'var(--panel-bg)',
                        border: isPass ? '' : '1px solid var(--border-color)',
                        color: isPass ? '' : 'var(--text-primary)'
                    }}
                >
                    {isPass ? 'Finalize Internship & Return to Dashboard' : 'Finalize Score & Return (Retake Required)'}
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel ${styles.retroForm}`}
        >
            <div className={styles.retroHeader}>
                <MessageSquare size={32} className="text-gradient" />
                <h2>Sprint Retrospective</h2>
                <p>Reflect on your shift before receiving your final evaluation.</p>
            </div>

            <div className={styles.retroFields}>
                <div className={styles.standupField}>
                    <label>
                        <span className={styles.standupLabel}>🟢 What went well?</span>
                    </label>
                    <textarea
                        value={wentWell}
                        onChange={e => setWentWell(e.target.value)}
                        placeholder='e.g., "I quickly diagnosed the P0 incident and communicated the fix clearly to the team"'
                        rows={3}
                        className={styles.standupTextarea}
                    />
                </div>
                <div className={styles.standupField}>
                    <label>
                        <span className={styles.standupLabel}>🔴 What was challenging?</span>
                    </label>
                    <textarea
                        value={challenging}
                        onChange={e => setChallenging(e.target.value)}
                        placeholder='e.g., "I struggled with prioritizing the P0 over my current ticket and lost time context-switching"'
                        rows={3}
                        className={styles.standupTextarea}
                    />
                </div>
                <div className={styles.standupField}>
                    <label>
                        <span className={styles.standupLabel}>🔄 What would you do differently?</span>
                    </label>
                    <textarea
                        value={doDifferently}
                        onChange={e => setDoDifferently(e.target.value)}
                        placeholder='e.g., "Next time I would immediately check the runbook before trying to fix the issue manually"'
                        rows={3}
                        className={styles.standupTextarea}
                    />
                </div>
            </div>

            <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading || !wentWell.trim() || !challenging.trim() || !doDifferently.trim()}
                style={{ width: '100%', marginTop: '1rem' }}
            >
                {loading ? <><Loader2 className="animate-spin" size={18} /> Evaluating Retrospective...</> : 'Submit Retrospective'}
            </button>
        </motion.div>
    );
}
