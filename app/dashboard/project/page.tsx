'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, Code2, AlertTriangle, ShieldAlert, Cpu, Clock, XCircle, Layout } from 'lucide-react';
import styles from './project.module.css';
import TribunalReviewModal from './TribunalReviewModal';

const FORGE_CHALLENGES = [
    {
        id: 'challenge-1-security',
        title: 'Mission 1: The Leaky Dashboard',
        description: 'A junior dev hardcoded a Supabase service key inside the React component and built a massive, unreadable monolith. Fix the security flaw and extract at least one sub-component.',
        initialCode: `import React, { useState, useEffect } from 'react';

// SECURITY FLAW: Hardcoded API Key (CWE-798)
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.vurnerable_secret_token_12345";

export default function UserDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.example.com/data', {
      headers: { Authorization: \`Bearer \${SUPABASE_SERVICE_KEY}\` }
    })
      .then(res => res.json())
      .then(json => {
        setData([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]);
        setLoading(false);
      });
  }, []);

  // ARCHITECTURE FLAW: Monolithic component handling everything
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Admin Dashboard</h1>
      {loading ? (
        <p>Loading user data...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {data.map((item, i) => (
             <div key={i} style={{ padding: '15px', border: '1px solid #444', borderRadius: '8px', background: '#222' }}>
                <h3 style={{ margin: 0, color: '#60a5fa' }}>{item.name || 'Unknown'}</h3>
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #444' }}>
                   <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Delete User</button>
                   <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}>Edit</button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}`,
        missions: [
            { icon: ShieldAlert, color: '#ef4444', text: 'Remove hardcoded SUPABASE_SERVICE_KEY' },
            { icon: Layout, color: '#8b5cf6', text: 'Extract UserCard into a separate component' }
        ]
    },
    {
        id: 'challenge-2-performance',
        title: 'Mission 2: The Infinite Loop',
        description: 'The dashboard is crashing users\' browsers because of an infinite render loop in a useEffect hook. Find it, fix the dependency array, and clean up the UI.',
        initialCode: `import React, { useState, useEffect } from 'react';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [updates, setUpdates] = useState(0);

  // PERFORMANCE FLAW: Missing dependency array causing infinite re-render fetch loop
  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setMetrics([{ label: 'Visitors', value: Math.floor(Math.random() * 1000) }]);
      setUpdates(updates + 1); // This triggers another render, which triggers this effect again!
    }, 1000);
  }); // <-- Missing dependency array

  return (
    <div style={{ padding: '20px', background: '#0d1117', color: '#fff', minHeight: '100vh' }}>
      <h1>Analytics</h1>
      <p style={{ color: '#ef4444' }}>Warning: Updates firing rapidly ({updates})</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ padding: '20px', border: '1px solid #30363d', borderRadius: '8px', background: '#161b22' }}>
            <h3 style={{ color: '#8b949e', margin: 0 }}>{m.label}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0 0 0' }}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
        missions: [
            { icon: Cpu, color: '#3b82f6', text: 'Fix the infinite loop by adding [] or proper dependencies' },
            { icon: Layout, color: '#8b5cf6', text: 'Ensure the component renders cleanly without crashing' }
        ]
    },
    {
        id: 'challenge-3-final',
        title: 'Mission 3: The Spaghetti Cart',
        description: 'A crucial e-commerce cart component is a tangled mess of inline styles and confusing state. Refactor it into a clean, modern React component.',
        initialCode: `import React, { useState } from 'react';

export default function ShoppingCart() {
  // CONFUSING STATE
  const [c, setC] = useState([{id: 1, n: 'Keyboard', p: 99}, {id: 2, n: 'Mouse', p: 49}]);
  const [t, setT] = useState(148);

  // INLINE STYLES EVERYWHERE
  return (
    <div style={{padding: 20, background: '#000', color: 'white', width: '100%', height:'100vh'}}>
      <h2 style={{borderBottom:'2px solid red', paddingBottom:10}}>Your Cart</h2>
      <div>
        {c.map((item, index) => (
          <div key={index} style={{display:'flex', justifyContent:'space-between', padding:10, borderBottom:'1px solid #333'}}>
            <span>{item.n}</span>
            <span style={{color:'green'}}>\${item.p}</span>
            <button onClick={() => {
                const nc = c.filter(cartItem => cartItem.id !== item.id);
                setC(nc);
                setT(t - item.p);
            }} style={{background:'red', color:'white', border:'none', borderRadius:4}}>X</button>
          </div>
        ))}
      </div>
      <div style={{marginTop:20, fontSize:24, textAlign:'right'}}>
        Total: \${t}
      </div>
      <button style={{width:'100%', padding:15, background:'blue', color:'white', border:'none', marginTop:20, fontSize:18, borderRadius:8}}>
        Checkout (Broken)
      </button>
    </div>
  );
}`,
        missions: [
            { icon: Layout, color: '#8b5cf6', text: 'Refactor variable names (c -> cart, t -> total) for readability' },
            { icon: ShieldAlert, color: '#ef4444', text: 'Fix the inline styles and use proper CSS/semantic HTML' }
        ]
    }
];

export default function ChaosEscapeRoomPage() {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [showTribunal, setShowTribunal] = useState(false);

    // Countdown Timer constraints
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes to fix
    const [timerActive, setTimerActive] = useState(false);
    const [timeExpired, setTimeExpired] = useState(false);

    useEffect(() => {
        // Load progression from local storage
        const savedLevel = localStorage.getItem('skillforge_forge_level');
        if (savedLevel) {
            const lvl = parseInt(savedLevel, 10);
            if (lvl < FORGE_CHALLENGES.length) {
                setCurrentLevel(lvl); // eslint-disable-line react-hooks/set-state-in-effect
            } else {
                // Completed all
                setCurrentLevel(FORGE_CHALLENGES.length - 1);
            }
        }
        setLoading(false);
    }, []);

    // Load code when level changes
    useEffect(() => {
        if (!loading) {
            const challenge = FORGE_CHALLENGES[currentLevel];
             
            setCode(challenge.initialCode); // eslint-disable-line react-hooks/set-state-in-effect
            setTimeLeft(25 * 60);
            setTimerActive(true);
            setTimeExpired(false);
            setShowTribunal(false);
        }
    }, [currentLevel, loading]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timerActive && timeLeft > 0 && !showTribunal) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && timerActive) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTimerActive(false);
            setTimeExpired(true);
        }
        return () => clearInterval(timer);
    }, [timerActive, timeLeft, showTribunal]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleNextProblem = () => {
        if (currentLevel < FORGE_CHALLENGES.length - 1) {
            const nextLvl = currentLevel + 1;
            setCurrentLevel(nextLvl);
            localStorage.setItem('skillforge_forge_level', nextLvl.toString());
        }
    };

    const handleResetLevel = () => {
        const challenge = FORGE_CHALLENGES[currentLevel];
        setCode(challenge.initialCode);
        setTimeLeft(25 * 60);
        setTimerActive(true);
        setTimeExpired(false);
        setShowTribunal(false);
    };

    const handleSubmitToTribunal = () => {
        setShowTribunal(true);
    };

    if (loading) {
        return <div className={styles.centered}><Loader2 className="animate-spin text-gradient" size={48} /></div>;
    }

    const currentChallenge = FORGE_CHALLENGES[currentLevel];
    const progressText = `Mission ${currentLevel + 1} of ${FORGE_CHALLENGES.length}`;
    const isLast = currentLevel === FORGE_CHALLENGES.length - 1;

    return (
        <div className={`animate-fade-in ${styles.container}`}>
            <div className={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            {progressText}
                        </span>
                    </div>
                    <h1 className={styles.title}><AlertTriangle className="text-gradient" size={32} style={{ display: 'inline', marginRight: '0.5rem', color: '#ef4444' }} /> {currentChallenge.title}</h1>
                    <p className={styles.subtitle}>{currentChallenge.description}</p>
                </div>

                <div className={styles.actions}>
                    {timerActive && (
                        <div className={`${styles.timer} ${timeLeft < 300 ? styles.timerUrgent : ''}`}>
                            <Clock size={16} />
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <button className="btn-glass" onClick={handleResetLevel}>
                        Reset Code
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmitToTribunal}
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
                    >
                        <ShieldAlert size={18} /> Submit to Tribunal
                    </button>
                </div>
            </div>

            <div className={styles.missionCards}>
                {currentChallenge.missions.map((mission, idx) => {
                    const Icon = mission.icon;
                    return (
                        <div key={idx} className={`glass-panel ${styles.missionCard}`}>
                            <Icon size={20} color={mission.color} />
                            <span>{mission.text}</span>
                        </div>
                    )
                })}
            </div>

            <div className={styles.editorContainer}>
                <div className={styles.editorHeader}>
                    <div className={styles.fileTab}>
                        <Code2 size={16} className="text-gradient" /> app/page.tsx
                    </div>
                </div>
                <div className={styles.editorWrapper}>
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: 'var(--font-mono)',
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                        }}
                    />
                </div>
            </div>

            {/* Time Expired Overlay */}
            {timeExpired && !showTribunal && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.5rem' }}>Time Expired!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You failed to remediate the legacy code before the production release window closed. The Tribunal rejects your submission.</p>
                        <button className="btn-primary" onClick={handleResetLevel}>Retry Mission</button>
                    </div>
                </div>
            )}

            {showTribunal && (
                <TribunalReviewModal
                    code={code}
                    onClose={() => setShowTribunal(false)}
                    onNext={handleNextProblem}
                    isLast={isLast}
                />
            )}
        </div>
    );
}
