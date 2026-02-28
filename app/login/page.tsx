'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);

    return (
        <main className={styles.main}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <Sparkles className={styles.logoIcon} size={32} />
                    <h1 className={styles.title}>Praxis AI</h1>
                    <p className={styles.subtitle}>
                        {isSignUp ? 'Create your account to start learning' : 'Welcome back to your dashboard'}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {isSignUp ? (
                        <SignUp
                            routing="hash"
                            signInUrl="/login"
                            forceRedirectUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: { width: '100%' },
                                    card: { background: 'transparent', boxShadow: 'none', border: 'none' },
                                },
                            }}
                        />
                    ) : (
                        <SignIn
                            routing="hash"
                            signUpUrl="/login"
                            forceRedirectUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: { width: '100%' },
                                    card: { background: 'transparent', boxShadow: 'none', border: 'none' },
                                },
                            }}
                        />
                    )}
                </div>

                <div className={styles.switchRow}>
                    <span>
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
