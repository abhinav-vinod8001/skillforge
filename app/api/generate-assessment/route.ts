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
        const skills = body.skills || [];
        const userSkills = Array.isArray(skills) && skills.length > 0 ? skills.join(', ') : 'JavaScript, Frontend Development';

        const prompt = `You are a strict technical recruiter generating a "Skill Scanner" screening test for an engineer.
The engineer claims to have these skills: ${userSkills}

Pick ONE specific, intermediate-level prerequisite concept from their skills (e.g., React hooks, SQL joins, Python list comprehensions, Promise resolution in Node.js).
Generate a SHORT (under 20 lines) code snippet in that language that contains EXACTLY ONE logical bug related to that concept.
The bug should not be a trivial syntax error (like a missing semicolon), but a logical error or anti-pattern that someone who actually knows the skill would catch immediately.

OUTPUT FORMAT: Wrap your response in these exact XML tags. Do NOT use markdown outside the tags.

<language>The programming language (e.g., javascript, typescript, python, sql)</language>
<concept>The specific concept being tested (e.g., "React useEffect Dependencies" or "SQL Left Joins")</concept>
<instructions>A 1-2 sentence instruction explaining what the code is SUPPOSED to do, and asking them to fix the single bug.</instructions>
<buggy_code>
[Insert the buggy code snippet here]
</buggy_code>`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite technical assessor. You generate clear, single-bug code snippets in strict XML format.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
        });

        const output = completion.choices[0]?.message?.content || '';

        const extract = (tag: string) => {
            const match = output.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
            return match ? match[1].trim() : '';
        };

        const language = extract('language').toLowerCase() || 'javascript';
        const concept = extract('concept') || 'Basic Data Structures';
        const instructions = extract('instructions') || 'Fix the logical error in the code below so it functions exactly as intended.';
        const buggyCode = extract('buggy_code') || `function add(a, b) {\n    return a - b; // Fix this bug\n}`;

        return NextResponse.json({
            language,
            concept,
            instructions,
            buggyCode
        });

    } catch (error: unknown) {
        console.error('Assessment Generation Error:', error);
        return NextResponse.json(
            { error: (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
