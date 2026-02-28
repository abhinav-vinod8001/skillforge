'use client';

import React, { useState } from 'react';
import { Bug, Lightbulb, FileText, GripVertical, AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './simulator.module.css';

export interface Ticket {
    id: string;
    title: string;
    priority: 'P0' | 'P1' | 'P2';
    type: 'bug' | 'feature' | 'docs';
    points: number;
    status: 'backlog' | 'in_progress' | 'done';
}

interface TicketBoardProps {
    tickets: Ticket[];
    onMoveTicket: (ticketId: string, newStatus: Ticket['status']) => void;
}

const COLUMNS: { key: Ticket['status']; label: string; color: string }[] = [
    { key: 'backlog', label: 'Backlog', color: '#94a3b8' },
    { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { key: 'done', label: 'Done', color: '#34d399' },
];

const PRIORITY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    P0: { icon: AlertTriangle, color: '#ef4444', label: 'Critical' },
    P1: { icon: ArrowUp, color: '#f59e0b', label: 'High' },
    P2: { icon: ArrowDown, color: '#3b82f6', label: 'Medium' },
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
    bug: { icon: Bug, color: '#ef4444' },
    feature: { icon: Lightbulb, color: '#a78bfa' },
    docs: { icon: FileText, color: '#60a5fa' },
};

export default function TicketBoard({ tickets, onMoveTicket }: TicketBoardProps) {
    const [draggedTicket, setDraggedTicket] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
        setDraggedTicket(ticketId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnKey: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnKey);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnKey: Ticket['status']) => {
        e.preventDefault();
        if (draggedTicket) {
            onMoveTicket(draggedTicket, columnKey);
        }
        setDraggedTicket(null);
        setDragOverColumn(null);
    };

    return (
        <div className={styles.kanban}>
            <div className={styles.kanbanHeader}>
                <h3>Sprint Board</h3>
                <span className={styles.kanbanCount}>{tickets.length} tickets</span>
            </div>
            <div className={styles.kanbanColumns}>
                {COLUMNS.map(col => {
                    const columnTickets = tickets.filter(t => t.status === col.key);
                    return (
                        <div
                            key={col.key}
                            className={`${styles.kanbanColumn} ${dragOverColumn === col.key ? styles.kanbanColumnDragOver : ''}`}
                            onDragOver={e => handleDragOver(e, col.key)}
                            onDragLeave={handleDragLeave}
                            onDrop={e => handleDrop(e, col.key)}
                        >
                            <div className={styles.kanbanColumnHeader}>
                                <span className={styles.kanbanColumnDot} style={{ background: col.color }} />
                                <span>{col.label}</span>
                                <span className={styles.kanbanColumnCount}>{columnTickets.length}</span>
                            </div>
                            <div className={styles.kanbanColumnBody}>
                                <AnimatePresence>
                                    {columnTickets.map(ticket => {
                                        const PriorityIcon = PRIORITY_CONFIG[ticket.priority]?.icon || ArrowRight;
                                        const priorityColor = PRIORITY_CONFIG[ticket.priority]?.color || '#94a3b8';
                                        const TypeIcon = TYPE_CONFIG[ticket.type]?.icon || FileText;
                                        const typeColor = TYPE_CONFIG[ticket.type]?.color || '#94a3b8';

                                        return (
                                            <motion.div
                                                key={ticket.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                draggable
                                                onDragStartCapture={e => handleDragStart(e, ticket.id)}
                                                className={`${styles.ticketCard} ${draggedTicket === ticket.id ? styles.ticketDragging : ''}`}
                                            >
                                                <div className={styles.ticketTop}>
                                                    <span className={styles.ticketId}>{ticket.id}</span>
                                                    <GripVertical size={14} className={styles.ticketGrip} />
                                                </div>
                                                <p className={styles.ticketTitle}>{ticket.title}</p>
                                                <div className={styles.ticketMeta}>
                                                    <span className={styles.ticketBadge} style={{ color: priorityColor, borderColor: `${priorityColor}44` }}>
                                                        <PriorityIcon size={12} /> {ticket.priority}
                                                    </span>
                                                    <span className={styles.ticketBadge} style={{ color: typeColor, borderColor: `${typeColor}44` }}>
                                                        <TypeIcon size={12} /> {ticket.type}
                                                    </span>
                                                    <span className={styles.ticketPoints}>{ticket.points} pts</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
