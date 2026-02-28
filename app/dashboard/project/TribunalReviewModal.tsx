'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Palette, Loader2, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AgentResult {
    agent: string;
    passed: boolean;
    feedback: string;
}

interface TribunalReviewModalProps {
    code: string;
    onClose: () => void;
    onNext: () => void;
    isLast: boolean;
}

export default function TribunalReviewModal({ code, onClose, onNext, isLast }: TribunalReviewModalProps) {
    const [results, setResults] = useState<AgentResult[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [overallPassed, setOverallPassed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        runTribunal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const runTribunal = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tribunal-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            setResults(data.tribunal);
            setOverallPassed(data.passed);
        } catch (e) {
            console.error(e);
            setResults([{ agent: 'System', passed: false, feedback: 'Tribunal disconnected. Check your connection.' }]);
        } finally {
            setLoading(false);
        }
    };

    const getAgentIcon = (agent: string) => {
        if (agent === 'Security') return <ShieldAlert size={24} />;
        if (agent === 'Performance') return <Cpu size={24} />;
        if (agent === 'UX') return <Palette size={24} />;
        return <ShieldCheck size={24} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}
            >
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck className="text-gradient" /> The Multi-Agent Tribunal
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>3 independent AIs are reviewing your code concurrently.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {loading ? (
                        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Loader2 className="animate-spin text-gradient" size={48} style={{ margin: '0 auto 1.5rem' }} />
                            <p>Analyzing Security Vectors...</p>
                            <p>Profiling React Render Tree...</p>
                            <p>Evaluating User Experience...</p>
                        </div>
                    ) : (
                        <>
                            {results?.map((result, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: result.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${result.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        display: 'flex',
                                        gap: '1.5rem',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{ color: result.passed ? '#34d399' : '#fca5a5', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '50%' }}>
                                        {getAgentIcon(result.agent)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: result.passed ? '#34d399' : '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {result.agent} Lead {result.passed ? <CheckCircle2 size={16} /> : <X size={16} />}
                                        </h3>
                                        <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                            &ldquo;{result.feedback}&rdquo;
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                {overallPassed ? (
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', color: '#34d399', marginBottom: '1rem' }}>Verdict: Passed. Outstanding work.</h3>
                                        {!isLast ? (
                                            <button onClick={onNext} className="btn-primary" style={{ background: '#10b981', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                                                Next Problem
                                            </button>
                                        ) : (
                                            <button onClick={() => router.push('/dashboard/export')} className="btn-primary" style={{ background: '#10b981', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                                                Claim Your Certificate
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>Verdict: Rejected. Return to the code.</h3>
                                        <button onClick={onClose} className="btn-glass" style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                                            Back to Editor
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
