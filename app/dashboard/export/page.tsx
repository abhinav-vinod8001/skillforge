'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Award, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { getSimulatorLog } from '@/utils/convex/db';
import styles from './export.module.css';

interface LogData {
    skill_focus: string;
    score: number;
    metrics: {
        score: number;
        bugs_resolved: number;
        efficiency: string;
    };
    completed_at: string;
}

export default function ExportPage() {
    const [log, setLog] = useState<LogData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [userName, setUserName] = useState('Praxis AI Scholar');
    const certificateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLatestLog();
    }, []);

    const fetchLatestLog = async () => {
        setLoading(true);
        setUserName('Guest Builder');

        const stored = await getSimulatorLog();
        if (stored) setLog(stored as any);
        setLoading(false);
    };

    const handleExport = async () => {
        if (!certificateRef.current) return;
        setExporting(true);

        try {
            // Dynamic import of html2pdf to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const element = certificateRef.current;
            const opt = {
                margin: 0,
                filename: `${userName}_PraxisAI_Certificate.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' as const }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <div className={styles.centered}><Loader2 className="animate-spin text-gradient" size={48} /></div>;
    }

    if (!log) {
        return (
            <div className={`animate-fade-in ${styles.emptyState}`}>
                <Award size={64} className="text-gradient" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h1>No Certifications Yet</h1>
                <p className={styles.subtitle}>Complete a session in the Internship Simulator to earn your proof of work.</p>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Export Proof of Work</h1>
                    <p className={styles.subtitle}>Download your cryptographically verified signal for recruiters.</p>
                </div>
                <button className="btn-primary" onClick={handleExport} disabled={exporting}>
                    {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    {exporting ? 'Generating PDF...' : 'Download Certificate PDF'}
                </button>
            </div>

            <div className={styles.certificateWrapper}>
                {/* Actual Certificate Element to be exported */}
                <div ref={certificateRef} className={styles.certificate}>
                    <div className={styles.certInner}>
                        <div className={styles.certHeader}>
                            <div className={styles.certLogo}>
                                <ShieldCheck size={40} color="#8b5cf6" />
                                <span>Praxis AI Verified</span>
                            </div>
                            <div className={styles.certDate}>
                                Issued: {log.completed_at ? new Date(log.completed_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>

                        <div className={styles.certBody}>
                            <h4 className={styles.certPretitle}>Certificate of Engineering Excellence</h4>
                            <h2 className={styles.certName}>{userName}</h2>
                            <p className={styles.certDesc}>
                                has successfully remediated intentional architectural and security flaws under the rigorous scrutiny of the <strong>Multi-Agent Engineering Tribunal</strong>.
                            </p>
                        </div>

                        <div className={styles.certMetrics}>
                            <div className={styles.metric}>
                                <span>Tribunal Verdict</span>
                                <strong style={{ color: '#34d399' }}>PASSED</strong>
                            </div>
                            <div className={styles.metric}>
                                <span>Vulnerabilities</span>
                                <strong>Patched</strong>
                            </div>
                            <div className={styles.metric}>
                                <span>Architecture</span>
                                <strong>Refactored</strong>
                            </div>
                        </div>

                        <div className={styles.certFooter}>
                            <div className={styles.signatureBlock}>
                                <div className={styles.signature}>Alex.AI</div>
                                <div className={styles.signTitle}>AI Engineering Manager</div>
                            </div>
                            <div className={styles.qrPlaceholder}>
                                <CheckCircle2 size={32} color="#10b981" />
                                <span style={{ fontSize: '0.6rem', color: '#6b7280', marginTop: '0.25rem' }}>Verified Log ID:<br />{(log.completed_at || '').substring(0, 10)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
