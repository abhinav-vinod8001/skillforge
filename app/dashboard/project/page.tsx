'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, Code2, AlertTriangle, ShieldAlert, Cpu, Clock, XCircle, Layout, Sparkles } from 'lucide-react';
import { getUserSkills, getProgress, saveForgeLevel } from '@/utils/convex/db';
import styles from './project.module.css';
import TribunalReviewModal from './TribunalReviewModal';

interface DynamicChallenge {
    title: string;
    description: string;
    initialCode: string;
    missions: string[];
}

export default function ChaosEscapeRoomPage() {
    const [missionsCompleted, setMissionsCompleted] = useState(0);
    const [challenge, setChallenge] = useState<DynamicChallenge | null>(null);
    const [code, setCode] = useState<string>('');
    const [statusText, setStatusText] = useState('Booting Chaos Engine...');
    const [loading, setLoading] = useState(true);
    const [showTribunal, setShowTribunal] = useState(false);

    // Countdown Timer constraints
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes to fix
    const [timerActive, setTimerActive] = useState(false);
    const [timeExpired, setTimeExpired] = useState(false);

    const generateNewMission = async () => {
        setLoading(true);
        setStatusText('Analyzing your syllabus...');
        try {
            const skills = await getUserSkills();
            setStatusText('Generating customized industry disaster...');

            const res = await fetch('/api/generate-blueprint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills })
            });

            if (!res.ok) throw new Error('Failed to generate mission');

            const data: DynamicChallenge = await res.json();
            setChallenge(data);
            setCode(data.initialCode);
            setTimeLeft(25 * 60);
            setTimerActive(true);
            setTimeExpired(false);
            setShowTribunal(false);
        } catch (e) {
            console.error(e);
            setStatusText('Failed to generate mission. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const { forgeLevel } = await getProgress();
            setMissionsCompleted(forgeLevel || 0);
            await generateNewMission();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timerActive && timeLeft > 0 && !showTribunal) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && timerActive) {
            setTimerActive(false);
            setTimeExpired(true);
        }
        return () => clearInterval(timer);
    }, [timerActive, timeLeft, showTribunal]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleNextProblem = async () => {
        const newCount = missionsCompleted + 1;
        setMissionsCompleted(newCount);
        await saveForgeLevel(newCount);
        await generateNewMission();
    };

    const handleResetLevel = () => {
        if (!challenge) return;
        setCode(challenge.initialCode);
        setTimeLeft(25 * 60);
        setTimerActive(true);
        setTimeExpired(false);
        setShowTribunal(false);
    };

    const handleSubmitToTribunal = () => {
        setShowTribunal(true);
    };

    const getMissionIcon = (text: string) => {
        const t = text.toLowerCase();
        if (t.includes('secur') || t.includes('key') || t.includes('jwt') || t.includes('token') || t.includes('inject')) return <ShieldAlert size={20} color="#ef4444" />;
        if (t.includes('perform') || t.includes('loop') || t.includes('render') || t.includes('slow') || t.includes('o(n')) return <Cpu size={20} color="#3b82f6" />;
        if (t.includes('style') || t.includes('css') || t.includes('ui') || t.includes('ux') || t.includes('arch')) return <Layout size={20} color="#8b5cf6" />;
        return <Sparkles size={20} color="#10b981" />;
    };

    if (loading || !challenge) {
        return (
            <div className={styles.centered}>
                <Loader2 className="animate-spin text-gradient" size={48} />
                <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>{statusText}</p>
            </div>
        );
    }

    const progressText = `Missions Conquered: ${missionsCompleted}`;

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            {progressText}
                        </span>
                    </div>
                    <h1 className={styles.title}><AlertTriangle className="text-gradient" size={32} style={{ display: 'inline', marginRight: '0.5rem', color: '#ef4444' }} /> {challenge.title}</h1>
                    <p className={styles.subtitle}>{challenge.description}</p>
                </div>

                <div className={styles.actions}>
                    {timerActive && (
                        <div className={`${styles.timer} ${timeLeft < 300 ? styles.timerUrgent : ''}`}>
                            <Clock size={16} />
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <button className="btn-glass" onClick={handleResetLevel}>
                        Reset Code
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmitToTribunal}
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
                    >
                        <ShieldAlert size={18} /> Submit to Tribunal
                    </button>
                </div>
            </div>

            <div className={styles.missionCards}>
                {challenge.missions.map((missionText, idx) => (
                    <div key={idx} className={`glass-panel ${styles.missionCard}`}>
                        {getMissionIcon(missionText)}
                        <span>{missionText}</span>
                    </div>
                ))}
            </div>

            <div className={styles.editorContainer}>
                <div className={styles.editorHeader}>
                    <div className={styles.fileTab}>
                        <Code2 size={16} className="text-gradient" /> vulnerable_file.tx
                    </div>
                </div>
                <div
                    className={styles.editorWrapper}
                    onPasteCapture={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        alert('⛔ Cheat Prevention: Copy-pasting is strictly disabled in the Forge. You must synthesize this solution manually.');
                    }}
                >
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: 'var(--font-mono)',
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                        }}
                    />
                </div>
            </div>

            {/* Time Expired Overlay */}
            {timeExpired && !showTribunal && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.5rem' }}>Time Expired!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You failed to remediate the legacy code before the production release window closed. The Tribunal rejects your submission.</p>
                        <button className="btn-primary" onClick={handleResetLevel}>Retry Mission</button>
                    </div>
                </div>
            )}

            {showTribunal && (
                <TribunalReviewModal
                    code={code}
                    originalCode={challenge.initialCode}
                    missions={challenge.missions}
                    onClose={() => setShowTribunal(false)}
                    onNext={handleNextProblem}
                    isLast={false}
                />
            )}
        </div>
    );
}
