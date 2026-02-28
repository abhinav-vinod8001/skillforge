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
    const groq = new Groq({
        apiKey: getGroqKey() || process.env.GROQ_API_KEY,
    });

    try {
        const body = await req.json();
        const skills = body.skills || [];
        const userSkills = Array.isArray(skills) && skills.length > 0 ? skills.join(', ') : 'React, JavaScript';

        const prompt = `You are a chaotic senior software architect generating a "Broken Code Escape Room" to train a junior developer.

User's Training Focus: ${userSkills}

Generate ONE highly realistic, incredibly messy file of code (e.g., a React component, a Python script, or an API route based on their skills).

CRUCIAL REQUIREMENT: The code you generate MUST be heavily inspired by a REAL-WORLD software industry disaster, a famous CVE, a known OWASP Top 10 vulnerability, or a documented engineering post-mortem (e.g., the Cloudflare regex catastrophic backtracking, the GitLab database deletion script, an S3 bucket misconfiguration, Log4j-style injection, or a classic race condition in a high-traffic microservice).

The code should attempt to accomplish a realistic task but contain EXACTLY 3 major industry-standard flaws. One of these flaws MUST be the root cause of the famous real-world disaster you chose.

Return ONLY a valid JSON object matching this exact structure:
{
  "title": "A witty title for this mission that hints at the real-world disaster (e.g., 'Mission: The Cloudflare Regex Meltdown')",
  "description": "A 2-3 sentence technical brief explaining what the file does, the chaos within, and explicitly stating which real-world industry problem or CVE this scenario is simulating so the user learns the history of it.",
  "initialCode": "The full string of flawed source code (around 40-70 lines long. MUST have properly escaped quotes and newlines to be valid JSON). Make it convincingly bad, just like the real incident.",
  "missions": [
    "Mission 1: Describe the first flaw to fix (e.g., 'Remove the hardcoded AWS key')",
    "Mission 2: Describe the second flaw (e.g., 'Fix the catastrophic regex backtracking')",
    "Mission 3: Describe the third flaw (e.g., 'Refactor the O(N^2) data mapping')"
  ]
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You generate JSON objects for coding challenges. Return strict JSON.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.8,
        });

        const output = completion.choices[0]?.message?.content || '{}';
        const projectData = JSON.parse(output);

        if (!projectData.initialCode || !projectData.missions) {
            throw new Error("Invalid format returned from AI.");
        }

        return NextResponse.json(projectData);
    } catch (error: unknown) {
        console.error('Groq Chaos Engine Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
