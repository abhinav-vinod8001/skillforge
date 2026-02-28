import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Briefcase } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Sparkles className={styles.logoIcon} />
          <span>Praxis AI</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className="btn-glass">Login</Link>
          <Link href="/login" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className={styles.title}>
            Master The Skills You <br /> <span className="text-gradient">Actually Need</span>
          </h1>
          <p className={styles.subtitle}>
            Upload your syllabus, uncover market demands, and let AI build your custom roadmap to success. Learn by building and simulating real internships.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className="btn-primary">
              Build Your Roadmap <ArrowRight size={18} />
            </Link>
            <Link href="/trends" className="btn-glass">
              <TrendingUp size={18} /> View Live Trends
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className={styles.features} style={{ animationDelay: '0.3s' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Briefcase size={32} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Virtual Internships</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Gain real experience through AI-simulated workplace environments.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <TrendingUp size={32} color="#3b82f6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Market Reality Check</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Identify gaps in your curriculum against true industry needs.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
