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
        const { title, description, milestone } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Missing chapter title or description" }, { status: 400 });
        }

        const prompt = `You are an elite, world-class Senior Staff Engineer and Technical Instructor. 
You are tasked with writing a highly detailed, immersive educational Chapter for a developer learning a new technology.

Topic to teach: ${title}
Context/Description: ${description}
Milestone objective for this chapter: ${milestone || 'Master the core concepts'}

CRITICAL REQUIREMENT: Your output MUST be strictly pure Markdown. Do not include any HTML tags or conversational filler outside of the markdown structure.

Your chapter MUST explicitly include the following sections mapped via Markdown Headings:
# ${title}
(Start with a very powerful, highly technical 2-3 paragraph deep-dive introduction into the WHAT and the WHY, explaining the core architecture and fundamental principles behind the topic.)

## Core Concepts
(Break down 2-3 intricate concepts clearly with robust technical terminology, avoiding overly simplistic analogies. Explain how it operates under the hood.)

## Implementation & Code Examples
(Provide at least 2 distinct, highly realistic, production-grade code snippets. Use markdown codeblocks with the correct language syntax. Include inline comments explaining complex lines. Do NOT write "Hello World" style code; write senior-level logic.)

## Best Practices & Industry Standards
(List 3-4 bullet points outlining common pitfalls and architectural best practices when using this technology in an enterprise environment.)

## Conclusion
(A brief summary connecting this knowledge directly to the milestone: ${milestone || 'Master the core concepts'}).`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite technical instructor. Output strictly rich, valid Markdown.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 4000
        });

        const content = completion.choices[0]?.message?.content || '';

        if (!content) {
            throw new Error("AI returned an empty response.");
        }

        return NextResponse.json({ content });
    } catch (error: unknown) {
        console.error('Groq Chapter Engine Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
