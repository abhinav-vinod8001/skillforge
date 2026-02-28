import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert technical curriculum analyzer. Extract precisely a JSON array of technical/soft skills found in the provided syllabus text. Only return the JSON array, no extra text.'
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
