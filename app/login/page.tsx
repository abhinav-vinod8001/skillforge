'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import styles from './login.module.css';

// Wrap any promise or thenable with a timeout
function withTimeout<T>(thenable: PromiseLike<T>, ms: number): Promise<T> {
    const promise = Promise.resolve(thenable);
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out')), ms)
    );
    return Promise.race([promise, timeout]);
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();

    // ─── LOCAL FALLBACK AUTH ─────────────────────────────────── //
    const localAuth = (signUp: boolean) => {
        const existing = localStorage.getItem('praxis_offline_users');
        const users: Record<string, { password: string; name: string }> = existing ? JSON.parse(existing) : {};

        if (signUp) {
            if (users[email]) {
                setError('An account with this email already exists.');
                setLoading(false);
                return;
            }
            const userName = name || email.split('@')[0];
            users[email] = { password, name: userName };
            localStorage.setItem('praxis_offline_users', JSON.stringify(users));
            localStorage.setItem('praxis_user', JSON.stringify({
                id: crypto.randomUUID(),
                email,
                name: userName,
            }));
            router.push('/dashboard');
        } else {
            if (!users[email] || users[email].password !== password) {
                setError('Invalid email or password.');
                setLoading(false);
                return;
            }
            localStorage.setItem('praxis_user', JSON.stringify({
                id: crypto.randomUUID(),
                email,
                name: users[email].name,
            }));
            router.push('/dashboard');
        }
    };

    // ─── MAIN AUTH HANDLER ───────────────────────────────────── //
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                const { data, error: insertErr } = await withTimeout(
                    supabase
                        .from('app_users')
                        .insert({ email, password, name: name || email.split('@')[0] })
                        .select()
                        .single(),
                    5000 // 5 second timeout
                );

                if (insertErr) {
                    if (insertErr.code === '23505') {
                        setError('An account with this email already exists.');
                    } else {
                        setError(insertErr.message);
                    }
                    setLoading(false);
                    return;
                }

                localStorage.setItem('praxis_user', JSON.stringify({
                    id: data.id,
                    email: data.email,
                    name: data.name,
                }));
                router.push('/dashboard');
            } else {
                const { data, error: selectErr } = await withTimeout(
                    supabase
                        .from('app_users')
                        .select('*')
                        .eq('email', email)
                        .eq('password', password)
                        .single(),
                    5000
                );

                if (selectErr || !data) {
                    setError('Invalid email or password.');
                    setLoading(false);
                    return;
                }

                localStorage.setItem('praxis_user', JSON.stringify({
                    id: data.id,
                    email: data.email,
                    name: data.name,
                }));
                router.push('/dashboard');
            }
        } catch {
            // Supabase unreachable or timed out — use local fallback
            console.warn('Supabase unreachable, using offline mode.');
            localAuth(isSignUp);
        }
    };

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

                <form onSubmit={handleAuth} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    {isSignUp && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@university.edu"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Sign Up' : 'Log In')}
                    </button>
                </form>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.toggleBtn}
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                    >
                        {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </main>
    );
}
