'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from '@clerk/nextjs';
import {
    Sparkles,
    Map,
    TrendingUp,
    Briefcase,
    FolderGit2,
    UploadCloud,
    TerminalSquare,
    Home,
    User
} from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, isSignedIn } = useUser();

    // Sync Clerk user → localStorage so db.ts can use the userId for Convex
    useEffect(() => {
        if (isSignedIn && user) {
            localStorage.setItem('praxis_user', JSON.stringify({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress || '',
                name: user.fullName || user.firstName || 'User',
            }));
        }
    }, [isSignedIn, user]);

    const navItems = [
        { label: 'Home', icon: Home, href: '/dashboard' },
        { label: 'Onboarding', icon: UploadCloud, href: '/dashboard/onboarding' },
        { label: 'Market Trends', icon: TrendingUp, href: '/dashboard/trends' },
        { label: 'My Roadmap', icon: Map, href: '/dashboard/roadmap' },
        { label: 'Forge Projects', icon: FolderGit2, href: '/dashboard/project' },
        { label: 'Prompt Lab', icon: TerminalSquare, href: '/dashboard/prompt-engineering' },
        { label: 'Intern Simulator', icon: Briefcase, href: '/dashboard/simulator' },
        { label: 'My Profile', icon: User, href: '/dashboard/profile' },
    ];

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={`glass-panel ${styles.sidebar}`}>
                <div className={styles.logo}>
                    <Sparkles className="text-gradient" size={28} />
                    <span>Praxis AI</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <Icon size={20} className={isActive ? 'text-gradient' : ''} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.userSection}>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: { width: 36, height: 36 },
                                },
                            }}
                        />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="redirect">
                            <button className={styles.logoutBtn}>
                                <User size={20} />
                                <span>Sign In</span>
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
