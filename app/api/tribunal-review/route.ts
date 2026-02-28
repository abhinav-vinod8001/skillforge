import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize 3 separate Groq clients to bypass rate-limits during concurrent calls
const groqSecurity = new Groq({ apiKey: process.env.GROQ_API_KEY_SECURITY || process.env.GROQ_API_KEY });
const groqPerformance = new Groq({ apiKey: process.env.GROQ_API_KEY_PERFORMANCE || process.env.GROQ_API_KEY });
const groqUX = new Groq({ apiKey: process.env.GROQ_API_KEY_UX || process.env.GROQ_API_KEY });

export async function POST(request: Request) {
    try {
        const { submittedCode, originalCode, missions } = await request.json();
        const code = submittedCode || '';

        if (!code) {
            return NextResponse.json({ error: 'Code is required for review.' }, { status: 400 });
        }

        // Build context string for agents
        const context = originalCode
            ? `\n\nORIGINAL FLAWED CODE:\n${originalCode}\n\nMISSIONS THE USER WAS TASKED TO FIX:\n${(missions || []).join('\n')}\n\nUSER'S SUBMITTED FIX:\n${code}`
            : code;

        // Agent 1: The Lead Security Architect
        const securityPrompt = `You are an elite, uncompromising CyberSec Lead Architect reviewing an intern's Pull Request.
    Review the following code for security vulnerabilities (e.g., hardcoded secrets, injection flaws, exposure of sensitive tokens).
    You MUST explain in detail:
    1. The exact security problem found (or that was successfully fixed).
    2. Why this matters in a real-world production environment.
    3. The exact correction required (or praise for what was done right).
    Respond ONLY in this exact JSON format:
    {"agent": "Security", "passed": true/false, "feedback": "Your detailed multi-sentence analysis."}`;

        // Agent 2: The Principal Performance Engineer
        const staffPrompt = `You are a Principal Performance Engineer obsessed with rendering optimization and system architecture.
    Review the following code. Check for infinite render loops, missing dependency arrays, or massive O(N^2) bottlenecks.
    You MUST explain in detail:
    1. The exact performance or architectural problem found (or that was successfully fixed).
    2. The exact mechanism of why it causes issues in the React lifecycle or JS engine.
    3. The exact correction required (or praise for what was done right).
    Respond ONLY in this exact JSON format:
    {"agent": "Performance", "passed": true/false, "feedback": "Your detailed multi-sentence analysis."}`;

        // Agent 3: The Lead UX & Accessibility Director
        const uxPrompt = `You are a strict Lead UX & Accessibility Director. Review the following code.
    Check for inline-style spaghetti, inaccessible buttons, missing semantic HTML, or confusing state variable names.
    You MUST explain in detail:
    1. The exact UX, semantic, or UI architecture problem found (or that was successfully fixed).
    2. Why this matters for maintainability or user experience.
    3. The exact correction required (or praise for what was done right).
    Respond ONLY in this exact JSON format:
    {"agent": "UX", "passed": true/false, "feedback": "Your detailed multi-sentence analysis."}`;

        // Execute all 3 agents concurrently
        const [securityRes, staffRes, uxRes] = await Promise.all([
            groqSecurity.chat.completions.create({
                messages: [{ role: 'system', content: securityPrompt }, { role: 'user', content: context }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
            }),
            groqPerformance.chat.completions.create({
                messages: [{ role: 'system', content: staffPrompt }, { role: 'user', content: context }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
            }),
            groqUX.chat.completions.create({
                messages: [{ role: 'system', content: uxPrompt }, { role: 'user', content: context }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
            })
        ]);

        const parseAgent = (raw: string, fallbackAgent: string) => {
            try {
                const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                return JSON.parse(cleaned);
            } catch {
                return { agent: fallbackAgent, passed: false, feedback: 'Failed to parse agent response.' };
            }
        };

        const results = [
            parseAgent(securityRes.choices[0]?.message?.content || '{}', 'Security'),
            parseAgent(staffRes.choices[0]?.message?.content || '{}', 'Performance'),
            parseAgent(uxRes.choices[0]?.message?.content || '{}', 'UX'),
        ];

        const overallPassed = results.every(r => r.passed === true);

        // Map to the shape the frontend expects: { agent, comment } in agent_comments
        const agentComments = results.map(r => ({
            agent: r.agent,
            comment: `${r.passed ? '✅ Passed' : '❌ Failed'} — ${r.feedback}`
        }));

        const passedCount = results.filter(r => r.passed).length;
        const overallFeedback = overallPassed
            ? `All ${passedCount} agents approved your submission. Your code demonstrates strong security practices, clean architecture, and solid UX principles.`
            : `${passedCount}/3 agents passed. Review the detailed feedback from each agent below to understand exactly what needs to be fixed.`;

        return NextResponse.json({
            passed: overallPassed,
            agent_comments: agentComments,
            feedback: overallFeedback
        });
    } catch (error: unknown) {
        console.error('Tribunal API Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
