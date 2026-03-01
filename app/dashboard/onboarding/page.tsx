'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Rocket, Loader2, CheckCircle2, Target, Code, Brain } from 'lucide-react';
import * as pdfjsLibTypes from 'pdfjs-dist';
import { saveSkills, saveSyllabus } from '@/utils/convex/db';
import styles from './onboarding.module.css';

// Use a type string or any for pdfjsLib since it will be loaded dynamically
let pdfjsLib: typeof pdfjsLibTypes | null = null;

if (typeof window !== 'undefined') {
    import('pdfjs-dist').then(pdfjs => {
        pdfjsLib = pdfjs;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    });
}

export default function OnboardingPage() {
    const [ambition, setAmbition] = useState('');
    const [currentTech, setCurrentTech] = useState('');
    const [targetSkills, setTargetSkills] = useState('');

    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ skills: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const parsePDF = async (file: File): Promise<string> => {
        if (!pdfjsLib) throw new Error("PDF parser loading, please wait.");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.filter((item) => 'str' in item).map((item) => (item as { str: string }).str).join(' ');
            fullText += pageText + ' ';
        }
        return fullText;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            let combinedInput = `My Ambition: ${ambition}\nMy Current Knowledge: ${currentTech}\nMy Target Learning Goals: ${targetSkills}`;

            if (file) {
                if (file.type === 'application/pdf') {
                    const pdfText = await parsePDF(file);
                    combinedInput += `\n\nReference Material/Syllabus: ${pdfText}`;
                } else {
                    const fileText = await file.text();
                    combinedInput += `\n\nReference Material/Syllabus: ${fileText}`;
                }
            }

            if (!ambition.trim() && !targetSkills.trim() && !file) {
                throw new Error("Please tell us your ambition, target skills, or upload a syllabus to proceed.");
            }

            // Call our new API to generate a strict Syllabus via Groq
            const res = await fetch('/api/generate-syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: combinedInput.substring(0, 15000) }) // limit size
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to analyze profile and generate syllabus");
            }

            const data = await res.json();

            // Save to Convex/localStorage
            if (data.skills) await saveSkills(data.skills);
            await saveSyllabus(data);

            setResult(data);
        } catch (err: unknown) {
            setError((err instanceof Error) ? err.message : "An error occurred during processing.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (result) {
        return (
            <div className={`animate-fade-in ${styles.container}`}>
                <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <CheckCircle2 size={72} className="text-gradient" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                    <h1 className={styles.title} style={{ fontSize: '2.5rem' }}>Profile Analyzed</h1>
                    <p className={styles.subtitle}>We&apos;ve extracted the exact prerequisites required for your ambition.</p>

                    <div className={styles.skillsGrid}>
                        {Array.isArray(result.skills) && result.skills.length > 0 ? (
                            result.skills.map((skill: string, i: number) => (
                                <span key={i} className={styles.skillTag}>{skill}</span>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1' }}>No specific technical skills were extracted. Try again with more detailed tech stacks.</p>
                        )}
                    </div>

                    <button onClick={() => router.push('/dashboard/assessment')} className="btn-primary" style={{ marginTop: '3rem', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        Advance to Skill Scanner <Rocket size={20} style={{ marginLeft: '0.5rem' }} />
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        You must pass the Tribunal&apos;s prerequisite theoretical test to proceed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Get Started</h1>
                <p className={styles.subtitle}>Tell us your grand ambition. We will dynamically adapt the entire platform&apos;s curriculum and incident simulations to match your trajectory.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.formContent}>

                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={18} className="text-gradient" /> My Ambition
                    </label>
                    <p className={styles.inputSublabel}>What is your ultimate goal? (e.g., Get a job as a Senior Frontend React Developer at an AI Startup)</p>
                    <textarea
                        className={styles.textarea}
                        value={ambition}
                        onChange={(e) => setAmbition(e.target.value)}
                        placeholder="I want to..."
                        rows={3}
                        required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Brain size={18} color="#d2a8ff" /> Current Intelligence
                    </label>
                    <p className={styles.inputSublabel}>What technologies, languages, or concepts do you already know?</p>
                    <input
                        type="text"
                        className={styles.input}
                        value={currentTech}
                        onChange={(e) => setCurrentTech(e.target.value)}
                        placeholder="e.g., HTML, CSS, Basic JavaScript, Python"
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Code size={18} color="#58a6ff" /> Target Upgrades
                    </label>
                    <p className={styles.inputSublabel}>What exactly do you want to master next on this platform?</p>
                    <input
                        type="text"
                        className={styles.input}
                        value={targetSkills}
                        onChange={(e) => setTargetSkills(e.target.value)}
                        placeholder="e.g., Next.js 15, Turbopack, Vector Databases"
                        required
                    />
                </div>

                <div className={styles.divider}>OPTIONAL: SYLLABUS / RESUME INGESTION</div>

                <div className={styles.uploadZone}>
                    <input
                        type="file"
                        id="syllabus-upload"
                        accept=".pdf,.txt"
                        className={styles.fileInput}
                        onChange={handleFileUpload}
                    />
                    <label htmlFor="syllabus-upload" className={styles.uploadLabel}>
                        <UploadCloud size={32} className="text-gradient" />
                        <h3>{file ? file.name : 'Upload existing curriculum or syllabus'}</h3>
                        <p>PDF or TXT up to 10MB</p>
                    </label>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isProcessing}
                    style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}
                >
                    {isProcessing ? (
                        <><Loader2 className="animate-spin" size={20} style={{ marginRight: '0.5rem' }} /> Processing Profile Data...</>
                    ) : (
                        <><Rocket size={20} style={{ marginRight: '0.5rem' }} /> Configure My Trajectory</>
                    )}
                </button>
            </form>
        </div>
    );
}
