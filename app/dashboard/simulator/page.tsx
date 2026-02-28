'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Flag, Briefcase } from 'lucide-react';
import { saveSimulatorLog, getUserSkills } from '@/utils/convex/db';
import styles from './simulator.module.css';
import StandupModal from './StandupModal';
import TicketBoard, { Ticket } from './TicketBoard';
import ChatPanel from './ChatPanel';
import SprintRetro from './SprintRetro';

type Channel = 'dm' | 'general' | 'incidents';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Seed tickets for the sprint board (personalized ones will replace these)
const DEFAULT_TICKETS: Ticket[] = [
    { id: 'TICKET-001', title: 'Fix login redirect after OAuth callback', priority: 'P1', type: 'bug', points: 3, status: 'backlog' },
    { id: 'TICKET-002', title: 'Add dark mode toggle to settings page', priority: 'P2', type: 'feature', points: 2, status: 'backlog' },
    { id: 'TICKET-003', title: 'Write API docs for /users endpoint', priority: 'P2', type: 'docs', points: 1, status: 'backlog' },
];

export default function SimulatorPage() {

    // Generate personalized tickets based on user skills
    function generatePersonalizedTickets(skills: string[]): Ticket[] {
        const skillSet = skills.map(s => s.toLowerCase());
        const ticketPool: Ticket[] = [];

        // React / Frontend tickets
        if (skillSet.some(s => s.includes('react') || s.includes('frontend') || s.includes('next') || s.includes('css') || s.includes('html'))) {
            ticketPool.push(
                { id: 'TICKET-001', title: 'Fix hydration mismatch in SSR component', priority: 'P1', type: 'bug', points: 3, status: 'backlog' },
                { id: 'TICKET-002', title: 'Build responsive dashboard with dark mode', priority: 'P2', type: 'feature', points: 5, status: 'backlog' },
                { id: 'TICKET-003', title: 'Write unit tests for auth context provider', priority: 'P2', type: 'docs', points: 2, status: 'backlog' },
            );
        }
        // Python / ML / Data tickets
        else if (skillSet.some(s => s.includes('python') || s.includes('ml') || s.includes('data') || s.includes('django') || s.includes('flask'))) {
            ticketPool.push(
                { id: 'TICKET-001', title: 'Fix memory leak in data pipeline batch processor', priority: 'P1', type: 'bug', points: 3, status: 'backlog' },
                { id: 'TICKET-002', title: 'Add caching layer to ML inference endpoint', priority: 'P2', type: 'feature', points: 4, status: 'backlog' },
                { id: 'TICKET-003', title: 'Document the ETL pipeline architecture', priority: 'P2', type: 'docs', points: 1, status: 'backlog' },
            );
        }
        // Node / Backend tickets
        else if (skillSet.some(s => s.includes('node') || s.includes('express') || s.includes('backend') || s.includes('api') || s.includes('sql'))) {
            ticketPool.push(
                { id: 'TICKET-001', title: 'Fix N+1 query in user orders endpoint', priority: 'P1', type: 'bug', points: 3, status: 'backlog' },
                { id: 'TICKET-002', title: 'Implement rate limiting middleware', priority: 'P2', type: 'feature', points: 3, status: 'backlog' },
                { id: 'TICKET-003', title: 'Write OpenAPI spec for payments API', priority: 'P2', type: 'docs', points: 2, status: 'backlog' },
            );
        }
        // Java / Android / Mobile tickets
        else if (skillSet.some(s => s.includes('java') || s.includes('kotlin') || s.includes('android') || s.includes('swift') || s.includes('mobile'))) {
            ticketPool.push(
                { id: 'TICKET-001', title: 'Fix ANR crash on main thread during sync', priority: 'P1', type: 'bug', points: 3, status: 'backlog' },
                { id: 'TICKET-002', title: 'Add offline-first caching with Room DB', priority: 'P2', type: 'feature', points: 4, status: 'backlog' },
                { id: 'TICKET-003', title: 'Document the CI/CD pipeline for app releases', priority: 'P2', type: 'docs', points: 1, status: 'backlog' },
            );
        }
        // Default / fallback
        else {
            return DEFAULT_TICKETS;
        }

        return ticketPool.slice(0, 3);
    }

    // Session phases: standup → workspace → retro → complete
    const [phase, setPhase] = useState<'standup' | 'workspace' | 'retro' | 'complete'>('standup');
    const [standupScore, setStandupScore] = useState(0);

    // Timer
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isActive, setIsActive] = useState(false);

    // Tickets
    const [tickets, setTickets] = useState<Ticket[]>(DEFAULT_TICKETS);

    // User skills for personalization
    const [userSkillFocus, setUserSkillFocus] = useState('Full Stack Development');

    // Messages per channel
    const [channelMessages, setChannelMessages] = useState<Record<Channel, Message[]>>({
        dm: [{ role: 'assistant', content: 'Good morning! I\'m Alex, your Engineering Manager. I\'ve added 3 tickets to your Sprint Board.\n\nTICKET-001 (P1 Bug): Fix login redirect — this is urgent. TICKET-002 (P2 Feature): Dark mode toggle. TICKET-003 (P2 Docs): API documentation.\n\nStart with the P1. Drag it to "In Progress" on your board when you begin. Let me know when you need help.' }],
        general: [{ role: 'assistant', content: '**Sarah:** Hey! Welcome to the team 👋 I\'m Sarah, Senior Frontend. If you need help with any React stuff, just ping me here.\n\n**Mike:** Yo. Mike here, Backend Lead. Don\'t break prod on your first day 😄' }],
        incidents: [{ role: 'assistant', content: '🟢 **All Systems Operational**\nLast incident: 3 days ago\nUptime: 99.97%\n\n_Monitoring active. Alerts will appear here._' }],
    });

    // Loading state
    const [loading, setLoading] = useState(false);
    const [loadingChannel, setLoadingChannel] = useState<Channel | null>(null);
    const [unreadChannels, setUnreadChannels] = useState<Set<Channel>>(new Set());

    // End-of-session metrics
    const [baseMetrics, setBaseMetrics] = useState<Record<string, number | string> | null>(null);

    // Incident timer
    const [incidentFired, setIncidentFired] = useState(false);

    const router = useRouter();

    // Load user skills and personalize tickets
    useEffect(() => {
        const loadSkills = async () => {
            try {
                const skills = await getUserSkills();
                if (skills.length > 0) {
                    const skillStr = skills.join(', ');
                    setUserSkillFocus(skillStr);

                    // Generate personalized tickets based on user skills
                    const personalizedTickets = generatePersonalizedTickets(skills);
                    setTickets(personalizedTickets);

                    // Also update the initial DM message
                    setChannelMessages(prev => ({
                        ...prev,
                        dm: [{ role: 'assistant', content: `Good morning! I'm Alex, your Engineering Manager. Based on your ${skillStr} background, I've curated 3 tickets for your Sprint Board.\n\n${personalizedTickets.map((t: Ticket) => `${t.id} (${t.priority} ${t.type[0].toUpperCase() + t.type.slice(1)}): ${t.title}`).join('. ')}\n\nStart with the P1. Drag it to "In Progress" on your board when you begin. Let me know when you need help.` }],
                    }));
                }
            } catch { }
        };
        loadSkills();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Countdown timer
    useEffect(() => {
        if (isActive && timeLeft > 0 && phase === 'workspace') {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft <= 0 && isActive) {
            handleEndShift();
        }
    }, [timeLeft, isActive, phase]);

    // Auto-fire incident after 3 minutes
    useEffect(() => {
        if (phase !== 'workspace' || incidentFired || !isActive) return;
        const timeout = setTimeout(async () => {
            setIncidentFired(true);
            await sendToChannel('incidents', '__AUTO_INCIDENT__');
        }, 180000); // 3 minutes
        return () => clearTimeout(timeout);
    }, [phase, incidentFired, isActive]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Parse ticket commands from AI messages
    const parseTicketsFromMessage = (text: string) => {
        const ticketRegex = /\[TICKET:({.*?})\]/g;
        let match;
        while ((match = ticketRegex.exec(text)) !== null) {
            try {
                const ticket = JSON.parse(match[1]);
                setTickets(prev => {
                    if (prev.find(t => t.id === ticket.id)) return prev;
                    return [...prev, { ...ticket, status: 'backlog' }];
                });
            } catch { }
        }
    };

    const sendToChannel = async (channel: Channel, text: string) => {
        const isAutoIncident = text === '__AUTO_INCIDENT__';

        if (!isAutoIncident) {
            setChannelMessages(prev => ({
                ...prev,
                [channel]: [...prev[channel], { role: 'user' as const, content: text }],
            }));
        }

        setLoading(true);
        setLoadingChannel(channel);

        try {
            const apiMessages = isAutoIncident
                ? [{ role: 'user', content: 'Generate a realistic P0 production incident alert NOW.' }]
                : [...channelMessages[channel], { role: 'user', content: text }].filter(m => m.role !== 'system');

            const res = await fetch('/api/simulator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    channel,
                    skill_focus: userSkillFocus,
                }),
            });

            const data = await res.json();

            if (data.isJSON && channel === 'dm') {
                // End simulation
                let parsed: Record<string, unknown> = { metrics: { score: 70, bugs_resolved: 0, efficiency: 'N/A' } };
                try { parsed = JSON.parse(data.content); } catch { }
                setBaseMetrics((parsed.metrics as Record<string, string | number>) || { score: 70 });
                setIsActive(false);
                setPhase('retro');
            } else {
                const responseContent = data.content || 'No response.';
                parseTicketsFromMessage(responseContent);

                // Strip [TICKET:...] from display
                const displayContent = responseContent.replace(/\[TICKET:\{.*?\}\]/g, '').trim();

                setChannelMessages(prev => ({
                    ...prev,
                    [channel]: [...prev[channel], { role: 'assistant' as const, content: displayContent }],
                }));

                // Mark unread if the user isn't looking at that channel
                setUnreadChannels(prev => {
                    const next = new Set(prev);
                    next.add(channel);
                    return next;
                });
            }
        } catch (err) {
            console.error(err);
            setChannelMessages(prev => ({
                ...prev,
                [channel]: [...prev[channel], { role: 'system' as const, content: 'Connection lost. Please retry.' }],
            }));
        } finally {
            setLoading(false);
            setLoadingChannel(null);
        }
    };

    const handleChannelSwitch = (channel: Channel) => {
        setUnreadChannels(prev => {
            const next = new Set(prev);
            next.delete(channel);
            return next;
        });
    };

    const handleMoveTicket = (ticketId: string, newStatus: Ticket['status']) => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    };

    const handleEndShift = async () => {
        setLoading(true);
        setLoadingChannel('dm');
        try {
            const res = await fetch('/api/simulator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...channelMessages.dm, { role: 'user', content: 'END_SIMULATION' }].filter(m => m.role !== 'system'),
                    channel: 'dm',
                    skill_focus: 'Full Stack Development',
                }),
            });
            const data = await res.json();
            let parsed: Record<string, unknown> = { metrics: { score: 70, bugs_resolved: 0, efficiency: 'N/A' } };
            try { parsed = JSON.parse(data.content); } catch { }
            setBaseMetrics((parsed.metrics as Record<string, string | number>) || { score: 70 });
            setIsActive(false);
            setPhase('retro');
        } catch {
            setBaseMetrics({ score: 60 });
            setPhase('retro');
        } finally {
            setLoading(false);
            setLoadingChannel(null);
        }
    };

    const handleStandupComplete = (score: number) => {
        setStandupScore(score);
        setPhase('workspace');
        setIsActive(true);
    };

    const handleRetroComplete = async (finalMetrics: Record<string, number | string>) => {
        await saveSimulatorLog({
            skill_focus: 'Full Stack Development',
            score: finalMetrics.score || 0,
            metrics: finalMetrics,
            completed_at: new Date().toISOString(),
        });
        router.push('/dashboard/export');
    };

    const ticketsCompleted = tickets.filter(t => t.status === 'done').length;

    // ─── RENDER ──────────────────────────────────
    if (phase === 'standup') {
        return <StandupModal onComplete={handleStandupComplete} />;
    }

    if (phase === 'retro') {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <SprintRetro
                    baseMetrics={baseMetrics}
                    standupScore={standupScore}
                    ticketsCompleted={ticketsCompleted}
                    onComplete={handleRetroComplete}
                />
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            {/* Office Topbar */}
            <div className={`glass-panel ${styles.topbar}`}>
                <div className={styles.topbarLeft}>
                    <Briefcase className="text-gradient" size={24} />
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Virtual Internship Workspace</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Sprint 1 · {ticketsCompleted}/{tickets.length} tickets
                        </p>
                    </div>
                </div>

                <div className={styles.topbarRight}>
                    <div className={`${styles.timer} ${timeLeft < 300 ? styles.timerUrgent : ''}`}>
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </div>
                    {isActive && (
                        <button onClick={handleEndShift} className="btn-glass" style={{ padding: '0.5rem 1rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                            <Flag size={14} /> Finish Shift
                        </button>
                    )}
                </div>
            </div>

            {/* Split Pane: Ticket Board | Chat */}
            <div className={styles.workspace}>
                <div className={styles.workspaceLeft}>
                    <TicketBoard tickets={tickets} onMoveTicket={handleMoveTicket} />
                </div>
                <div className={styles.workspaceRight}>
                    <ChatPanel
                        channelMessages={channelMessages}
                        onSendMessage={sendToChannel}
                        loading={loading}
                        loadingChannel={loadingChannel}
                        isActive={isActive}
                        unreadChannels={unreadChannels}
                        onChannelSwitch={handleChannelSwitch}
                    />
                </div>
            </div>
        </div>
    );
}
