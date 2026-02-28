'use client';

import { useState, useEffect } from 'react';
import { Trophy, ChevronRight, Zap, Star, Lock, Target, RotateCcw, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import styles from './scenario.module.css';

// ─── CHALLENGE DATA ──────────────────────────────────────────────────── //
export const CHALLENGES = [
    {
        id: 'flood-predictor',
        title: 'Kerala Flood Predictor Bot',
        category: 'Agrotech AI',
        difficulty: 'Intermediate',
        icon: '🌊',
        scenario: `You are an AI product manager at an agrotech startup in Kerala. Your team has built a flood prediction chatbot for farmers, but it gives vague responses like "There might be rain." The client (Kerala State Disaster Management Authority) wants specific alerts like "RED ALERT: 85% probability of flooding in Ernakulam district within 24 hours." Write a system prompt that makes the bot output precise, structured alerts.`,
        objective: 'Write a system prompt that transforms the bot to produce structured, actionable flood alerts with probability scores and district-level specificity.',
        disruption: '⚡ Disruption: The client now also needs Malay and Tamil language support in alerts. Refine your prompt to handle multi-language output.',
        tags: ['Role-Prompting', 'Output Formatting', 'Domain Expertise'],
        maxScore: 100
    },
    {
        id: 'spice-agent',
        title: 'Spice Inventory AI Agent',
        category: 'Retail AI',
        difficulty: 'Beginner',
        icon: '🌶️',
        scenario: `A Munnar spice exporter wants an AI agent to manage their inventory. When asked "What spices do we have?", the current AI gives a wall of text. The manager wants a structured table with Spice Name, Stock (kg), Reorder Level, and Status (OK/REORDER). Write a prompt that makes the AI output clean, tabular inventory data.`,
        objective: 'Craft a prompt that produces consistent, structured tabular output for inventory management.',
        disruption: '⚡ Disruption: The manager now wants a "PRIORITY REORDER" flag for any item below 20% stock. Update your prompt.',
        tags: ['Few-Shot', 'Structured Output', 'Formatting'],
        maxScore: 100
    },
    {
        id: 'code-debugger',
        title: 'Code Debugger Co-Pilot',
        category: 'Engineering',
        difficulty: 'Advanced',
        icon: '🐛',
        scenario: `Your team's junior devs use an AI pair-programmer. When they paste buggy Python code, the AI just rewrites it without explaining why it was wrong. This harms learning. Write a prompt that makes the AI: (1) identify the specific bug and its root cause, (2) explain the fix in plain English, (3) provide the corrected code with inline comments. Do NOT just fix—teach.`,
        objective: 'Build a prompt that enforces a strict 3-step debugging response format focused on teaching.',
        disruption: '⚡ Disruption: Junior devs give up easily. Make the AI also add an "Encouragement" line before its debugging output.',
        tags: ['Chain-of-Thought', 'Role-Playing', 'Structured Output'],
        maxScore: 100
    },
    {
        id: 'content-moderator',
        title: 'Regional Language Content Moderator',
        category: 'Trust & Safety',
        difficulty: 'Intermediate',
        icon: '🛡️',
        scenario: `A Malayalam social media platform needs a content moderation AI. The challenge: Malayalam sarcasm and cultural phrases are often misclassified as harmful. Write a prompt that makes the AI: (1) detect the language/dialect, (2) assess cultural context before labeling, (3) output a JSON verdict with fields: is_harmful (bool), confidence (0-1), reason (string), recommendation (string).`,
        objective: 'Write a culturally-aware moderation prompt that outputs structured JSON verdicts.',
        disruption: '⚡ Disruption: The platform now also has Tulu content. Extend your prompt to handle Tulu while noting limited training data.',
        tags: ['Zero-Shot', 'Cultural Context', 'JSON Output'],
        maxScore: 100
    },
    {
        id: 'research-summarizer',
        title: 'Academic Research Summarizer',
        category: 'Education',
        difficulty: 'Beginner',
        icon: '📄',
        scenario: `A professor at a Kerala university wants an AI assistant to help students who paste in dense research paper abstracts. The AI currently produces summaries as difficult as the original. Create a prompt that: (1) summarizes for a B.Tech second-year student, (2) extracts 3 key takeaways as bullet points, (3) suggests one practical application in Indian tech context.`,
        objective: 'Engineer a prompt that transforms academic jargon into accessible student-friendly summaries with structured takeaways.',
        disruption: '⚡ Disruption: The professor wants a "Difficulty Score" (1-10) added to each summary to help students gauge reading effort.',
        tags: ['Audience-Targeting', 'Few-Shot', 'Structured Output'],
        maxScore: 100
    }
];

const BADGES = [
    { id: 'first-attempt', name: 'First Attempt', icon: '🎯', desc: 'Completed your first challenge', threshold: 1 },
    { id: 'prompt-apprentice', name: 'Prompt Apprentice', icon: '📝', desc: 'Scored 60+ on any challenge', threshold: 60 },
    { id: 'prompt-engineer', name: 'Prompt Engineer', icon: '⚙️', desc: 'Scored 80+ on any challenge', threshold: 80 },
    { id: 'prompt-master', name: 'Prompt Master', icon: '🏆', desc: 'Scored 90+ on any challenge', threshold: 90 },
];

type ScoreResult = {
    clarity: number;
    specificity: number;
    effectiveness: number;
    total: number;
    feedback: string;
    suggestions: string[];
    unlocked_badge?: string;
};

type Progress = {
    [challengeId: string]: { bestScore: number; attempts: number; completed: boolean };
};

export default function ScenarioChallenge() {
    const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGES[0]);
    const [phase, setPhase] = useState<'select' | 'drafting' | 'disruption' | 'result'>('select');
    const [promptInput, setPromptInput] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
    const [progress, setProgress] = useState<Progress>({});
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [showDisruption, setShowDisruption] = useState(false);

    useEffect(() => {
        // Load progress from localStorage
        try {
            const saved = localStorage.getItem('skillforge_prompt_progress');
            if (saved) setProgress(JSON.parse(saved));
            const badges = localStorage.getItem('skillforge_prompt_badges');
            if (badges) setEarnedBadges(JSON.parse(badges));
        } catch { }
    }, []);

    const saveProgress = (cId: string, score: number) => {
        const prev = progress[cId] || { bestScore: 0, attempts: 0, completed: false };
        const updated = {
            ...progress,
            [cId]: {
                bestScore: Math.max(prev.bestScore, score),
                attempts: prev.attempts + 1,
                completed: score >= 70
            }
        };
        setProgress(updated);
        localStorage.setItem('skillforge_prompt_progress', JSON.stringify(updated));

        // Check badge unlocks
        const newBadges = [...earnedBadges];
        if (!newBadges.includes('first-attempt')) {
            newBadges.push('first-attempt');
        }
        if (score >= 90 && !newBadges.includes('prompt-master')) newBadges.push('prompt-master');
        else if (score >= 80 && !newBadges.includes('prompt-engineer')) newBadges.push('prompt-engineer');
        else if (score >= 60 && !newBadges.includes('prompt-apprentice')) newBadges.push('prompt-apprentice');
        setEarnedBadges(newBadges);
        localStorage.setItem('skillforge_prompt_badges', JSON.stringify(newBadges));
    };

    const handleStartChallenge = (challenge: typeof CHALLENGES[0]) => {
        setSelectedChallenge(challenge);
        setPhase('drafting');
        setPromptInput('');
        setScoreResult(null);
        setShowDisruption(false);
    };

    const handleEvaluate = async () => {
        if (!promptInput.trim()) return;
        setIsEvaluating(true);
        try {
            const res = await fetch('/api/evaluate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptInput,
                    scenario: selectedChallenge.scenario,
                    objective: selectedChallenge.objective
                })
            });
            if (!res.ok) throw new Error('Evaluation failed');
            const data: ScoreResult = await res.json();
            setScoreResult(data);
            setPhase('result');
            saveProgress(selectedChallenge.id, data.total);
        } catch {
            setScoreResult({
                clarity: 0, specificity: 0, effectiveness: 0,
                total: 0, feedback: 'Evaluation failed. Check your API connection.',
                suggestions: []
            });
            setPhase('result');
        } finally {
            setIsEvaluating(false);
        }
    };

    const ScoreMeter = ({ label, score }: { label: string; score: number }) => (
        <div className={styles.scoreMeter}>
            <div className={styles.scoreMeterLabel}>
                <span>{label}</span>
                <span className={styles.scoreValue}>{score}/100</span>
            </div>
            <div className={styles.scoreBar}>
                <div
                    className={styles.scoreBarFill}
                    style={{
                        width: `${score}%`,
                        background: score >= 80 ? '#238636' : score >= 60 ? '#d29922' : '#da3633'
                    }}
                />
            </div>
        </div>
    );

    const totalAttempts = Object.values(progress).reduce((a, b) => a + b.attempts, 0);
    const bestScore = Object.values(progress).reduce((a, b) => Math.max(a, b.bestScore), 0);

    // ─── SELECT PHASE ──────────────────────────────────────────── //
    if (phase === 'select') {
        return (
            <div className={styles.container}>
                <div className={styles.challengeHeader}>
                    <div className={styles.challengeHeaderLeft}>
                        <Target size={18} />
                        <div>
                            <h3>Scenario Challenges</h3>
                            <p>Real-world prompt engineering tasks. Engineer a prompt, submit for evaluation, earn badges.</p>
                        </div>
                    </div>
                    <div className={styles.statsBar}>
                        <div className={styles.stat}>
                            <span className={styles.statVal}>{totalAttempts}</span>
                            <span className={styles.statLabel}>Attempts</span>
                        </div>
                        <div className={styles.statDiv} />
                        <div className={styles.stat}>
                            <span className={styles.statVal}>{bestScore}</span>
                            <span className={styles.statLabel}>Best Score</span>
                        </div>
                        <div className={styles.statDiv} />
                        <div className={styles.stat}>
                            <span className={styles.statVal}>{earnedBadges.length}/4</span>
                            <span className={styles.statLabel}>Badges</span>
                        </div>
                    </div>
                </div>

                {earnedBadges.length > 0 && (
                    <div className={styles.badgesRow}>
                        {BADGES.filter(b => earnedBadges.includes(b.id)).map(b => (
                            <div key={b.id} className={styles.badge}>
                                <span className={styles.badgeIcon}>{b.icon}</span>
                                <span className={styles.badgeName}>{b.name}</span>
                            </div>
                        ))}
                        {BADGES.filter(b => !earnedBadges.includes(b.id)).map(b => (
                            <div key={b.id} className={`${styles.badge} ${styles.badgeLocked}`}>
                                <Lock size={14} />
                                <span className={styles.badgeName}>{b.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.challengeGrid}>
                    {CHALLENGES.map(c => {
                        const prog = progress[c.id];
                        return (
                            <div key={c.id} className={styles.challengeCard} onClick={() => handleStartChallenge(c)}>
                                <div className={styles.challengeCardTop}>
                                    <span className={styles.challengeIcon}>{c.icon}</span>
                                    <div>
                                        <div className={styles.challengeTitle}>{c.title}</div>
                                        <div className={styles.challengeCategory}>{c.category}</div>
                                    </div>
                                    {prog?.completed && <CheckCircle size={18} className={styles.donecheck} />}
                                </div>
                                <p className={styles.challengeScenarioPreview}>{c.scenario.substring(0, 120)}...</p>
                                <div className={styles.challengeCardBottom}>
                                    <span className={`${styles.diffBadge} ${styles[c.difficulty.toLowerCase()]}`}>{c.difficulty}</span>
                                    {prog && <span className={styles.bestScoreLabel}>Best: {prog.bestScore}/100</span>}
                                    <ChevronRight size={16} className={styles.startArrow} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ─── DRAFTING PHASE ────────────────────────────────────────── //
    if (phase === 'drafting' || isEvaluating) {
        return (
            <div className={styles.container}>
                <div className={styles.draftHeader}>
                    <button className={styles.backBtn} onClick={() => setPhase('select')}>← Back</button>
                    <div className={styles.draftHeaderMid}>
                        <span className={styles.challengeIcon}>{selectedChallenge.icon}</span>
                        <div>
                            <h3>{selectedChallenge.title}</h3>
                            <span className={`${styles.diffBadge} ${styles[selectedChallenge.difficulty.toLowerCase()]}`}>{selectedChallenge.difficulty}</span>
                        </div>
                    </div>
                    <div className={styles.tagsRow}>{selectedChallenge.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}</div>
                </div>

                <div className={styles.draftWorkspace}>
                    <div className={styles.contextPane}>
                        <div className={styles.paneSection}>
                            <h4>📋 Scenario</h4>
                            <p>{selectedChallenge.scenario}</p>
                        </div>
                        <div className={styles.paneSection}>
                            <h4><Target size={14} style={{ display: 'inline', marginRight: '4px' }} />Objective</h4>
                            <p className={styles.objective}>{selectedChallenge.objective}</p>
                        </div>
                        <div className={`${styles.paneSection} ${styles.disruptionBox}`}>
                            <h4>
                                <Zap size={14} style={{ display: 'inline', marginRight: '4px', color: '#d29922' }} />
                                Mid-Task Disruption
                            </h4>
                            {showDisruption
                                ? <p className={styles.disruptionText}>{selectedChallenge.disruption}</p>
                                : <button className={styles.revealBtn} onClick={() => setShowDisruption(true)}>Reveal disruption after first submission</button>
                            }
                        </div>
                    </div>

                    <div className={styles.editorPane}>
                        <div className={styles.editorTopbar}>
                            <span className={styles.editorTitle}>📝 Your Prompt</span>
                            <span className={styles.editorHint}>Shift+Enter for new line · Enter to submit</span>
                        </div>
                        <textarea
                            className={styles.editorTextarea}
                            placeholder={`Write your prompt here. Be specific and clear.\n\nExample start: "You are an expert [role]. When given [input], you must output [format]..."`}
                            value={promptInput}
                            onChange={e => setPromptInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEvaluate(); } }}
                            disabled={isEvaluating}
                            autoFocus
                        />
                        <div className={styles.editorFooter}>
                            <span className={styles.charCount}>{promptInput.length} characters</span>
                            <button
                                className={styles.evaluateBtn}
                                onClick={handleEvaluate}
                                disabled={!promptInput.trim() || isEvaluating}
                            >
                                {isEvaluating ? (
                                    <><Clock size={16} className={styles.spin} /> Evaluating...</>
                                ) : (
                                    <><Send size={16} /> Submit for Evaluation</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── RESULT PHASE ─────────────────────────────────────────── //
    if (phase === 'result' && scoreResult) {
        const grade = scoreResult.total >= 90 ? 'S' : scoreResult.total >= 80 ? 'A' : scoreResult.total >= 70 ? 'B' : scoreResult.total >= 60 ? 'C' : 'D';
        const gradeColor = scoreResult.total >= 80 ? '#238636' : scoreResult.total >= 60 ? '#d29922' : '#da3633';
        const newBadge = BADGES.find(b =>
            scoreResult.total >= 90 ? b.id === 'prompt-master' :
                scoreResult.total >= 80 ? b.id === 'prompt-engineer' :
                    scoreResult.total >= 60 ? b.id === 'prompt-apprentice' : ''
        );
        return (
            <div className={styles.container}>
                <div className={styles.resultHeader}>
                    <button className={styles.backBtn} onClick={() => setPhase('select')}>← All Challenges</button>
                    <span>{selectedChallenge.icon} {selectedChallenge.title} — Evaluation Report</span>
                    <button className={styles.retryBtn} onClick={() => { setPhase('drafting'); setScoreResult(null); setShowDisruption(true); }}>
                        <RotateCcw size={14} /> Refine & Retry
                    </button>
                </div>

                <div className={styles.resultBody}>
                    <div className={styles.gradePanel}>
                        <div className={styles.gradeCircle} style={{ borderColor: gradeColor, color: gradeColor }}>
                            {grade}
                        </div>
                        <div className={styles.totalScore}>{scoreResult.total}<span>/100</span></div>
                        {newBadge && earnedBadges.includes(newBadge.id) && (
                            <div className={styles.badgeEarned}>
                                <Trophy size={16} /> {newBadge.icon} {newBadge.name} Unlocked!
                            </div>
                        )}
                    </div>

                    <div className={styles.scoresPanel}>
                        <h4>Score Breakdown</h4>
                        <ScoreMeter label="🎯 Clarity" score={scoreResult.clarity} />
                        <ScoreMeter label="🔍 Specificity" score={scoreResult.specificity} />
                        <ScoreMeter label="⚡ Effectiveness" score={scoreResult.effectiveness} />
                    </div>

                    <div className={styles.feedbackPanel}>
                        <h4><Star size={14} style={{ display: 'inline', marginRight: '6px' }} />Feedback</h4>
                        <p className={styles.feedbackText}>{scoreResult.feedback}</p>

                        {scoreResult.suggestions && scoreResult.suggestions.length > 0 && (
                            <div className={styles.suggestions}>
                                <h5>💡 Suggestions to Improve</h5>
                                <ul>
                                    {scoreResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className={styles.disruptionCallout}>
                            <AlertCircle size={16} style={{ color: '#d29922', flexShrink: 0 }} />
                            <div>
                                <strong>Try the Disruption:</strong>
                                <p>{selectedChallenge.disruption}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
