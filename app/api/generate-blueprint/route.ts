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

CRUCIAL REQUIREMENT 1: The code you generate MUST be heavily inspired by a REAL-WORLD software industry disaster, a famous CVE, a known OWASP Top 10 vulnerability, or a documented engineering post-mortem (e.g., the Cloudflare regex catastrophic backtracking, the GitLab database deletion script, an S3 bucket misconfiguration, Log4j-style injection, or a classic race condition in a high-traffic microservice).

CRUCIAL REQUIREMENT 2: Present the scenario as an investigative logic PUZZLE. Do not just make syntax errors. Create deeply twisted, problematic logic and spaghetti architecture that forces the user to truly read, trace, and understand what the program is doing in a real software development environment before they can fix it.

The code should attempt to accomplish a realistic task but contain EXACTLY 3 major industry-standard flaws. One of these flaws MUST be the root cause of the famous real-world disaster you chose.

Return ONLY a valid JSON object matching this exact structure:
{
  "title": "A witty title for this mission that hints at the real-world disaster (e.g., 'Mission: The Cloudflare Regex Meltdown')",
  "description": "A 3-4 sentence technical brief presenting this as an investigative puzzle. Explain the real-world production environment context, hint at the twisted logic within, and explicitly state which real-world industry problem or CVE this scenario is simulating.",
  "initialCode": "The full string of flawed source code (around 40-70 lines long. MUST have properly escaped quotes and newlines to be valid JSON). Make it convincingly bad logic, just like the real incident.",
  "missions": [
    "Mission 1: Give a puzzle-like clue for the first flaw (e.g., 'Investigate why the authentication token is visible to the client')",
    "Mission 2: Give a clue for the second flaw (e.g., 'Trace the catastrophic rendering loop crashing the browser')",
    "Mission 3: Give a clue for the third flaw (e.g., 'Untangle the O(N^2) data mapping bottleneck')"
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
