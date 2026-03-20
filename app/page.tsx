import Link from 'next/link';
import { ArrowRight, Sparkles, BrainCircuit, Briefcase, ShieldAlert, Rocket } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {}
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

      {}
      <section className={styles.hero}>
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className={styles.title}>
            Master The Skills You <br /> <span className="text-gradient">Actually Need</span>
          </h1>
          <p className={styles.subtitle}>
            State-of-the-art AI generates your engineering roadmap, tests your knowledge in the Tribunal, and rapidly upskills you through virtual internship simulations.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className="btn-primary">
              Enter The Forge <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn-glass">
              <Rocket size={18} /> View Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className={styles.features} style={{ animationDelay: '0.3s', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <BrainCircuit size={32} color="#58a6ff" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Dynamic Syllabus</h3>
            <p style={{ color: 'var(--text-secondary)' }}>AI analyzes your ambition and builds a phase-by-phase chronological roadmap to mastery.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <ShieldAlert size={32} color="#da3633" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>The AI Tribunal</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Prove your skills against rigorous AI examinations probing your current knowledge and missing prerequisites.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Briefcase size={32} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Virtual Internships</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Gain real experience through AI-simulated agile workplace sprints and ticket assignments.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
