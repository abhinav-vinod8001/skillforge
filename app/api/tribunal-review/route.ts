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

        // Agent 1: The Pragmatic Security Lead
        const securityPrompt = `You are a pragmatic CyberSec Lead Engineer. Review the following React code for security vulnerabilities.
    Check if the user removed any hardcoded API keys or secrets (like Supabase service_role keys).
    If they fixed the core security flaw, gracefully pass them. It doesn't have to be perfect, just secure from glaring leaks.
    Respond ONLY in this exact JSON format:
    {"agent": "Security", "passed": true/false, "feedback": "Your constructive feedback here."}`;

        // Agent 2: The Pragmatic Staff Engineer
        const staffPrompt = `You are a pragmatic Staff Engineer who cares about performance and architecture. Review the following React code.
    Did the user fix the infinite render loop (e.g. by adding the missing dependency array to useEffect)? Did they attempt to break the monolithic component down even slightly?
    If the core infinite loop is fixed and some effort is shown, pass them gracefully. Focus on teaching, not punishing.
    Respond ONLY in this exact JSON format:
    {"agent": "Performance", "passed": true/false, "feedback": "Your constructive feedback here."}`;

        // Agent 3: The Constructive UX Director
        const uxPrompt = `You are a constructive UX Director. Review the following React code.
    Does this code have proper styling classes? Is the UI somewhat functional?
    Be lenient on minor visual polish. Pass them if the component looks like a cohesive effort.
    Respond ONLY in this exact JSON format:
    {"agent": "UX", "passed": true/false, "feedback": "Your constructive feedback here."}`;

        // Execute all 3 agents concurrently using Promise.all for massive performance gains
        const [securityRes, staffRes, uxRes] = await Promise.all([
            groqSecurity.chat.completions.create({
                messages: [{ role: 'system', content: securityPrompt }, { role: 'user', content: code }],
                model: 'llama-3.3-70b-versatile',
                response_format: { type: 'json_object' },
            }),
            groqPerformance.chat.completions.create({
                messages: [{ role: 'system', content: staffPrompt }, { role: 'user', content: code }],
                model: 'llama-3.3-70b-versatile',
                response_format: { type: 'json_object' },
            }),
            groqUX.chat.completions.create({
                messages: [{ role: 'system', content: uxPrompt }, { role: 'user', content: code }],
                model: 'llama-3.3-70b-versatile',
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
