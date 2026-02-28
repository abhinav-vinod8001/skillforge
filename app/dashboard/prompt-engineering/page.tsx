'use client';

import { useState } from 'react';
import { TerminalSquare, Send, Sparkles, BookOpen, User, Bot, RotateCcw, Target, FlaskConical, Trophy } from 'lucide-react';
import styles from './prompt.module.css';
import ScenarioChallenge from './ScenarioChallenge';
import Leaderboard from './Leaderboard';

type Message = {
    role: 'user' | 'ai' | 'system';
    content: string;
};

const TECHNIQUES = [
    {
        id: 'zero-shot',
        title: 'Zero-Shot Prompting',
        desc: 'Asking the AI to perform a task without any examples.',
        lesson: 'Zero-shot prompting relies entirely on the AI\'s pre-trained knowledge. It works best for simple, common tasks. Be clear and direct.',
        example: 'Classify this review: "The battery life is terrible." \nSentiment: '
    },
    {
        id: 'few-shot',
        title: 'Few-Shot Prompting',
        desc: 'Providing a few examples to guide the AI\'s output format.',
        lesson: 'When you need a specific format or tone, providing 1-3 examples drastically improves the AI\'s accuracy by showing it exactly what you want.',
        example: 'Review: "Amazing camera!" Format: Positive\nReview: "Arrived broken." Format: Negative\nReview: "The screen is very bright." Format: '
    },
    {
        id: 'role-playing',
        title: 'Role-Playing (Persona)',
        desc: 'Assigning a specific persona or profession to the AI.',
        lesson: 'Telling the AI "Act as an expert..." changes the vocabulary and depth of its response. It frames the context of the answer.',
        example: 'Act as a Senior Software Engineer answering a junior developer. Explain what a React Hook is in two sentences.'
    },
    {
        id: 'chain-of-thought',
        title: 'Chain of Thought',
        desc: 'Forcing the AI to explain its reasoning step-by-step.',
        lesson: 'Adding phrases like "Let\'s think step by step" forces the AI to break down complex logic, drastically reducing hallucination and math errors.',
        example: 'Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now? Let\'s think step by step.'
    }
];

type Tab = 'practice' | 'challenges' | 'leaderboard';

export default function PromptLabPage() {
    const [activeTab, setActiveTab] = useState<Tab>('practice');
    const [activeTechnique, setActiveTechnique] = useState(TECHNIQUES[0]);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: 'Welcome to the Prompt Lab. Select a technique from the left and try writing a prompt below.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        try {
            const res = await fetch('/api/prompt-lab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMsg })
            });
            if (!res.ok) throw new Error('API request failed');
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'system', content: 'Error: Failed to connect to AI model. Check your API key.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            {/* ─── TOP BAR ───────────────────────────────── */}
            <div className={styles.topbar}>
                <div className={styles.topbarLeft}>
                    <TerminalSquare size={20} className="text-gradient" />
                    <h1>Prompt Engineering Lab</h1>
                </div>
                <div className={styles.topbarRight}>
                    {/* Tab Switcher */}
                    <div className={styles.tabSwitcher}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'practice' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('practice')}
                        >
                            <FlaskConical size={14} />
                            Practice
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'challenges' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('challenges')}
                        >
                            <Target size={14} />
                            Challenges
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'leaderboard' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('leaderboard')}
                        >
                            <Trophy size={14} />
                            Leaderboard
                        </button>
                    </div>
                    {activeTab === 'practice' && (
                        <button
                            onClick={() => setMessages([{ role: 'system', content: `Reset session. Currently practicing: ${activeTechnique.title}` }])}
                            className={styles.resetBtn}
                        >
                            <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            Reset
                        </button>
                    )}
                    <div className={styles.timer}>Interactive Playground</div>
                </div>
            </div>

            {/* ─── CHALLENGES TAB ─────────────────────────── */}
            {activeTab === 'challenges' && (
                <div className={styles.challengeTabContent}>
                    <ScenarioChallenge />
                </div>
            )}

            {/* ─── LEADERBOARD TAB ─────────────────────────── */}
            {activeTab === 'leaderboard' && (
                <div className={styles.challengeTabContent}>
                    <Leaderboard />
                </div>
            )}

            {/* ─── PRACTICE TAB ───────────────────────────── */}
            {activeTab === 'practice' && (
                <div className={styles.workspace}>
                    {/* Left: Curriculum Menu */}
                    <div className={styles.workspaceLeft}>
                        <div className={styles.menuHeader}>
                            <h3><BookOpen size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Techniques</h3>
                        </div>
                        <div className={styles.menuList}>
                            {TECHNIQUES.map(tech => (
                                <div
                                    key={tech.id}
                                    className={`${styles.menuItem} ${activeTechnique.id === tech.id ? styles.menuItemActive : ''}`}
                                    onClick={() => setActiveTechnique(tech)}
                                >
                                    <div className={styles.menuItemTitle}>
                                        {activeTechnique.id === tech.id && <Sparkles size={14} className="text-gradient" />}
                                        {tech.title}
                                    </div>
                                    <div className={styles.menuItemDesc}>{tech.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Playground */}
                    <div className={styles.workspaceRight}>
                        <div className={styles.lessonHeader}>
                            <h2>{activeTechnique.title}</h2>
                            <p>{activeTechnique.lesson}</p>
                            <div className={styles.lessonExample}>
                                <strong>Example:</strong> <br />
                                {activeTechnique.example}
                            </div>
                        </div>

                        <div className={styles.chatArea}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.msgUser : styles.msgAi}`}>
                                    {msg.role !== 'system' && (
                                        <div className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : styles.avatarAi}`}>
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                    )}
                                    <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : msg.role === 'ai' ? styles.bubbleAi : styles.systemBubble}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className={`${styles.message} ${styles.msgAi}`}>
                                    <div className={`${styles.avatar} ${styles.avatarAi}`}><Bot size={14} /></div>
                                    <div className={styles.loading}>
                                        <span className={styles.spinner}>...</span> thinking
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.inputContainer}>
                            <div className={styles.inputHelper}>
                                <span>Type your prompt below</span>
                                <button onClick={() => setInput(activeTechnique.example)} className={styles.copyExampleBtn}>
                                    Try the example above
                                </button>
                            </div>
                            <div className={styles.inputWrapper}>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Enter prompt..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                />
                                <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim() || isLoading}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
