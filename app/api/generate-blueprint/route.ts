import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { project } = await request.json();

        if (!project) {
            return NextResponse.json({ error: 'Project context is required' }, { status: 400 });
        }

        const prompt = `You are a chaotic, lazy, legacy developer committing directly to main.
    Write a Next.js/React component for this project.
    Name: ${project.name}
    Description: ${project.description}
    
    CRITICAL RESTRICTION: You MUST intentionally inject the following 3 real-world GitHub-issue-style flaws into the code. Do not write perfect code. Make it look like a real, slightly rushed PR.
    1. Security Flaw (CWE-798/CWE-312): Hardcode a sensitive token (e.g., const AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE") directly in the component, or place a Supabase service_role key where it shouldn't be.
    2. Performance Flaw (React Race Condition / Memoization Failure): Create a nasty rendering bottleneck. For example, explicitly omit dependencies in a useEffect causing an infinite fetch loop, or use an expensive, un-memoized calculation inside the main render path.
    3. Architecture Flaw (The "God Component"): Put everything (styles, data fetching logic, complex layout, nested modals) into one massive >200 line unreadable file without breaking it down into smaller, logical sub-components.

    Output ONLY valid TSX code using Lucide React icons. Do not output markdown ticks. Make the UI look somewhat decent so the user is under the illusion it's working code until it breaks or is audited.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7, // higher temp for more chaotic generation
        });

        let code = completion.choices[0]?.message?.content || '// Error generating code';

        // Clean up markdown ticks if Llama still includes them
        code = code.replace(/```(tsx|jsx|ts|js)?\n/g, '').replace(/```/g, '').trim();

        return NextResponse.json({ code });
    } catch (error: unknown) {
        console.error('Groq API Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
