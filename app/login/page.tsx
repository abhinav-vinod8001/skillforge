'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);

    const clerkAppearance = {
        elements: {
            rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
            card: {
                background: 'var(--panel-bg)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            },
            headerTitle: { color: 'var(--text-primary)' },
            headerSubtitle: { color: 'var(--text-secondary)' },
            socialButtonsBlockButton: { border: '1px solid var(--border-color)' },
            socialButtonsBlockButtonText: { color: 'var(--text-primary)' },
            dividerLine: { background: 'var(--border-color)' },
            dividerText: { color: 'var(--text-secondary)' },
            formFieldLabel: { color: 'var(--text-primary)' },
            formFieldInput: {
                background: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
            },
            formButtonPrimary: {
                background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                color: '#fff',
                '&:hover': {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                }
            },
            footerActionText: { color: 'var(--text-secondary)' },
            footerActionLink: { color: '#a78bfa' }
        },
    };

    return (
        <main className={styles.main}>
            <div className={styles.authWrapper}>
                <div className={styles.header}>
                    <Sparkles className={styles.logoIcon} size={32} />
                    <h1 className={styles.title}>Praxis AI</h1>
                    <p className={styles.subtitle}>
                        {isSignUp ? 'Create your account to start learning' : 'Welcome back to your dashboard'}
                    </p>
                </div>

                <div className={styles.clerkContainer}>
                    {isSignUp ? (
                        <SignUp
                            routing="hash"
                            signInUrl="/login"
                            forceRedirectUrl="/dashboard"
                            appearance={clerkAppearance}
                        />
                    ) : (
                        <SignIn
                            routing="hash"
                            signUpUrl="/login"
                            forceRedirectUrl="/dashboard"
                            appearance={clerkAppearance}
                        />
                    )}
                </div>

                <div className={styles.switchRow}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    </span>
                    <button
                        type="button"
                        className={styles.switchBtn}
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </main>
    );
}
