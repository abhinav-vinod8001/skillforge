import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const getGroqKey = () => {
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_SECURITY,
        process.env.GROQ_API_KEY_PERFORMANCE,
        process.env.GROQ_API_KEY_UX
    ].filter(Boolean);
    return keys[Math.floor(Math.random() * keys.length)];
};

export async function POST(req: Request) {
    const groq = new Groq({ apiKey: getGroqKey() || process.env.GROQ_API_KEY });

    try {
        const body = await req.json();
        const { originalCode, userCode, concept, language } = body;

        const prompt = `You are a strict Senior Staff Software Engineer evaluating a candidate's "Skill Scanner" assessment.

The candidate was given this buggy code snippet:
\`\`\`${language}
${originalCode}
\`\`\`

The concept they needed to understand and fix was: **${concept}**

This is the candidate's submitted fix:
\`\`\`${language}
${userCode}
\`\`\`

Analyze their fix. Did they actually identify and fix the bug correctly according to the concept? 
Did they just hack a bypass or add a useless comment without fixing the structural issue? Be strict but fair.

OUTPUT FORMAT: Wrap your response in these exact XML tags. Do NOT use markdown outside the tags.

<pass>true OR false</pass>
<feedback>A strict 2-3 sentence explanation of why they passed or exactly why they failed. Speak directly to the candidate as a Senior Engineer.</feedback>
<missing_prerequisite>If they failed, name the exact core concept they don't understand (e.g., "React Context Dependency Injection"). If they passed, write "None".</missing_prerequisite>`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite code reviewer. Adhere strictly to the requested XML tag format.' },
                { role: 'user', content: prompt }
            ],
            // Switch to a stronger model for code evaluation logic if possible, 
            // but 8b-instant is usually fast and good enough for true/false grading
            model: 'llama-3.1-8b-instant',
            temperature: 0.1, // Low temp for reliable grading
        });

        const output = completion.choices[0]?.message?.content || '';

        const extract = (tag: string) => {
            const match = output.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
            return match ? match[1].trim() : '';
        };

        const passStr = extract('pass').toLowerCase();
        const pass = passStr === 'true' || passStr === 'yes';
        const feedback = extract('feedback') || 'Could not evaluate the code.';
        const missingPrerequisite = extract('missing_prerequisite') || 'Unknown';

        return NextResponse.json({
            pass,
            feedback,
            missingPrerequisite: pass ? null : missingPrerequisite
        });

    } catch (error: unknown) {
        console.error('Assessment Evaluation Error:', error);
        return NextResponse.json(
            { error: (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
