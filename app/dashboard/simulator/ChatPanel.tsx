'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Hash, AtSign, AlertTriangle, Loader2, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './simulator.module.css';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

type Channel = 'dm' | 'general' | 'incidents';

interface ChatPanelProps {
    channelMessages: Record<Channel, Message[]>;
    onSendMessage: (channel: Channel, text: string) => Promise<void>;
    loading: boolean;
    loadingChannel: Channel | null;
    isActive: boolean;
    unreadChannels: Set<Channel>;
    onChannelSwitch: (channel: Channel) => void;
}

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: React.ElementType; color: string; description: string }> = {
    dm: { label: '@Alex', icon: AtSign, color: '#a78bfa', description: 'Your Engineering Manager' },
    general: { label: '#team-general', icon: Hash, color: '#60a5fa', description: 'Team chat' },
    incidents: { label: '#incidents', icon: AlertTriangle, color: '#f87171', description: 'Production alerts' },
};

export default function ChatPanel({
    channelMessages,
    onSendMessage,
    loading,
    loadingChannel,
    isActive,
    unreadChannels,
    onChannelSwitch,
}: ChatPanelProps) {
    const [activeChannel, setActiveChannel] = useState<Channel>('dm');
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const currentMessages = useMemo(() => channelMessages[activeChannel] || [], [channelMessages, activeChannel]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages, loading]);

    const handleSwitchChannel = (ch: Channel) => {
        setActiveChannel(ch);
        onChannelSwitch(ch);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const text = input;
        setInput('');
        await onSendMessage(activeChannel, text);
    };

    return (
        <div className={styles.chatPanel}>
            {/* Channel Tabs */}
            <div className={styles.channelTabs}>
                {(Object.entries(CHANNEL_CONFIG) as [Channel, typeof CHANNEL_CONFIG.dm][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isActiveTab = activeChannel === key;
                    const hasUnread = unreadChannels.has(key) && !isActiveTab;

                    return (
                        <button
                            key={key}
                            className={`${styles.channelTab} ${isActiveTab ? styles.channelTabActive : ''}`}
                            onClick={() => handleSwitchChannel(key)}
                        >
                            <Icon size={14} style={{ color: isActiveTab ? cfg.color : undefined }} />
                            <span>{cfg.label}</span>
                            {hasUnread && (
                                <span className={styles.unreadBadge}>
                                    <Bell size={10} />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Messages */}
            <div className={styles.messages}>
                <AnimatePresence>
                    {currentMessages.map((m, i) => (
                        <motion.div
                            key={`${activeChannel}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userWrapper : styles.aiWrapper}`}
                        >
                            {m.role === 'assistant' && (
                                <div className={styles.avatar} style={{
                                    background: activeChannel === 'incidents'
                                        ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                                        : activeChannel === 'general'
                                            ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                            : undefined
                                }}>
                                    {activeChannel === 'dm' ? 'A' : activeChannel === 'general' ? 'T' : '!'}
                                </div>
                            )}
                            <div className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : m.role === 'system' ? styles.systemBubble : styles.aiBubble}`}>
                                {m.content}
                            </div>
                            {m.role === 'user' && (
                                <div className={`${styles.avatar} ${styles.userAvatar}`}><User size={16} /></div>
                            )}
                        </motion.div>
                    ))}
                    {loading && loadingChannel === activeChannel && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.messageWrapper}>
                            <div className={styles.avatar}>
                                {activeChannel === 'dm' ? 'A' : activeChannel === 'general' ? 'T' : '!'}
                            </div>
                            <div className={`${styles.bubble} ${styles.aiBubble} ${styles.typing}`}>
                                <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Message ${CHANNEL_CONFIG[activeChannel].label}...`}
                    className={styles.input}
                    disabled={loading || !isActive}
                />
                <button type="submit" disabled={loading || !input.trim() || !isActive} className={styles.sendBtn}>
                    {loading && loadingChannel === activeChannel ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
            </form>
        </div>
    );
}
