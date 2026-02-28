import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Helper to distribute load across available keys
const getGroqKey = () => {
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_SECURITY,
        process.env.GROQ_API_KEY_PERFORMANCE,
        process.env.GROQ_API_KEY_UX
    ].filter(Boolean); // Only use keys that actually exist

    // Pick a random key
    return keys[Math.floor(Math.random() * keys.length)];
};

export async function POST(request: Request) {
    // Instantiate per-request so the random key selection actually rotates
    const groq = new Groq({
        apiKey: getGroqKey() || process.env.GROQ_API_KEY,
    });

    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert technical curriculum analyzer. Extract the technical/soft skills found in the provided syllabus text. You must return a valid JSON object with a single key "skills" containing an array of strings. Do not return a raw array.'
                },
                {
                    role: 'user',
                    content: `Extract the skills from this syllabus:\n\n${text}`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const output = completion.choices[0]?.message?.content || '{"skills": []}';
        let data;
        try {
            // Handle cases where the model returns {"skills": ["A", "B"]}
            data = JSON.parse(output);
            if (!data.skills && Array.isArray(data)) {
                data = { skills: data };
            }
        } catch {
            data = { skills: [] };
        }

        // Normalize: handle all possible shapes the model might return
        if (!data.skills) {
            // Maybe it returned a plain array at root
            const firstKey = Object.keys(data)[0];
            if (firstKey && Array.isArray(data[firstKey])) {
                data = { skills: data[firstKey] };
            } else {
                data = { skills: [] };
            }
        }
        if (!Array.isArray(data.skills)) data.skills = [];

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Groq API Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
