import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize 3 separate Groq clients to bypass rate-limits during concurrent calls
const groqSecurity = new Groq({ apiKey: process.env.GROQ_API_KEY_SECURITY || process.env.GROQ_API_KEY });
const groqPerformance = new Groq({ apiKey: process.env.GROQ_API_KEY_PERFORMANCE || process.env.GROQ_API_KEY });
const groqUX = new Groq({ apiKey: process.env.GROQ_API_KEY_UX || process.env.GROQ_API_KEY });

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required for review.' }, { status: 400 });
        }

        // Agent 1: The Lead Security Architect
        const securityPrompt = `You are an elite, uncompromising CyberSec Lead Architect reviewing an intern's Pull Request.
    Review the following React code line-by-line for security vulnerabilities (e.g., hardcoded secrets, injection flaws, exposure of sensitive tokens).
    Do NOT just say pass/fail. You MUST explain in detail:
    1. The exact security problem found.
    2. Why this is dangerous in a real-world production environment.
    3. The exact correction that must be made to fix it.
    If they fixed the core security flaw, you may pass them, but still provide deep architectural context.
    Respond ONLY in this exact JSON format (Ensure 'feedback' is a highly detailed, multi-sentence paragraph explaining the problem and correction):
    {"agent": "Security", "passed": true/false, "feedback": "Detailed explanation of the flaw, why it matters, and the exact correction required."}`;

        // Agent 2: The Principal Performance Engineer
        const staffPrompt = `You are a Principal Performance Engineer obsessed with rendering optimization and system architecture.
    Review the following React code. Check for infinite render loops, missing dependency arrays, or massive O(N^2) bottlenecks.
    Do NOT just say pass/fail. You MUST explain in detail:
    1. The exact performance or architectural problem found.
    2. The exact mechanism of why it causes a bottleneck or infinite loop in the React lifecycle or JS engine.
    3. The exact correction that must be made to fix it.
    If the core bottleneck is resolved, pass them, but provide a deep technical breakdown.
    Respond ONLY in this exact JSON format (Ensure 'feedback' is a highly detailed, multi-sentence paragraph):
    {"agent": "Performance", "passed": true/false, "feedback": "Detailed explanation of the flaw, why it matters, and the exact correction required."}`;

        // Agent 3: The Lead UX & Accessibility Director
        const uxPrompt = `You are a strict Lead UX & Accessibility Director. Review the following React code.
    Check for inline-style spaghetti, inaccessible buttons, missing semantic HTML, or confusing state variable names.
    Do NOT just say pass/fail. You MUST explain in detail:
    1. The exact UX, semantic, or UI architecture problem found.
    2. Why this is bad practice for maintainability or user experience.
    3. The exact correction that must be made (e.g., extracting components, using CSS modules, fixing variable names).
    Respond ONLY in this exact JSON format (Ensure 'feedback' is a highly detailed, multi-sentence paragraph):
    {"agent": "UX", "passed": true/false, "feedback": "Detailed explanation of the flaw, why it matters, and the exact correction required."}`;

        // Execute all 3 agents concurrently using Promise.all for massive performance gains
        const [securityRes, staffRes, uxRes] = await Promise.all([
            groqSecurity.chat.completions.create({
                messages: [{ role: 'system', content: securityPrompt }, { role: 'user', content: code }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
            }),
            groqPerformance.chat.completions.create({
                messages: [{ role: 'system', content: staffPrompt }, { role: 'user', content: code }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
            }),
            groqUX.chat.completions.create({
                messages: [{ role: 'system', content: uxPrompt }, { role: 'user', content: code }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' },
            })
        ]);

        const results = [
            JSON.parse(securityRes.choices[0]?.message?.content || '{"agent": "Security", "passed": false, "feedback": "Failed to parse."}'),
            JSON.parse(staffRes.choices[0]?.message?.content || '{"agent": "Performance", "passed": false, "feedback": "Failed to parse."}'),
            JSON.parse(uxRes.choices[0]?.message?.content || '{"agent": "UX", "passed": false, "feedback": "Failed to parse."}')
        ];

        const overallPassed = results.every(r => r.passed === true);

        return NextResponse.json({ passed: overallPassed, tribunal: results });
    } catch (error: unknown) {
        console.error('Tribunal API Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
