'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import * as pdfjsLibTypes from 'pdfjs-dist';
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
    const [file, setFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{skills: string[]} | null>(null);
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
            const pageText = textContent.items.map((item: {str: string}) => item.str).join(' ');
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
            let syllabusText = textInput;

            if (file) {
                if (file.type === 'application/pdf') {
                    syllabusText = await parsePDF(file);
                } else {
                    syllabusText = await file.text();
                }
            }

            if (!syllabusText.trim()) {
                throw new Error("Please upload a file or paste your syllabus text.");
            }

            // Call our API to extract skills via Groq
            const res = await fetch('/api/analyze-syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: syllabusText.substring(0, 15000) }) // limit size
            });

            if (!res.ok) throw new Error("Failed to analyze syllabus");

            const data = await res.json();

            // Save to LocalStorage for offline testing
            localStorage.setItem('skillforge_skills', JSON.stringify(data.skills));

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
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle2 size={64} className="text-gradient" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                    <h1 className={styles.title}>Syllabus Analyzed</h1>
                    <p className={styles.subtitle}>We&apos;ve extracted the core skills from your curriculum.</p>

                    <div className={styles.skillsGrid}>
                        {Array.isArray(result.skills) && result.skills.length > 0 ? (
                            result.skills.map((skill: string, i: number) => (
                                <span key={i} className={styles.skillTag}>{skill}</span>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1' }}>No specific skills were extracted. Try again with more detailed text.</p>
                        )}
                    </div>

                    <button onClick={() => router.push('/dashboard/trends')} className="btn-primary" style={{ marginTop: '2rem' }}>
                        Scan Market Trends <UploadCloud size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Upload Your Curriculum</h1>
                <p className={styles.subtitle}>Drag and drop your syllabus or paste key topics to identify gaps against real market demand.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.formContent}>
                <div className={`glass-panel ${styles.uploadZone}`}>
                    <input
                        type="file"
                        id="syllabus-upload"
                        accept=".pdf,.txt"
                        className={styles.fileInput}
                        onChange={handleFileUpload}
                    />
                    <label htmlFor="syllabus-upload" className={styles.uploadLabel}>
                        <UploadCloud size={48} className="text-gradient" />
                        <h3>{file ? file.name : 'Choose a file or drag it here'}</h3>
                        <p>PDF or TXT up to 10MB</p>
                    </label>
                </div>

                <div className={styles.divider}>OR</div>

                <div className={styles.textInputWrapper}>
                    <label className={styles.inputLabel}>Paste key topics</label>
                    <textarea
                        className={styles.textarea}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder='e.g., "C++, basic data structures, operating systems, networking..."'
                        rows={5}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isProcessing || (!file && !textInput)}
                    style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
                >
                    {isProcessing ? (
                        <><Loader2 className="animate-spin" size={20} /> Analyzing Curriculum...</>
                    ) : (
                        <><FileText size={20} /> Analyze Syllabus</>
                    )}
                </button>
            </form>
        </div>
    );
}
