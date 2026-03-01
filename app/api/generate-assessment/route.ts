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
        const { current_knowledge, missing_prerequisites } = body;

        const currentStr = Array.isArray(current_knowledge) && current_knowledge.length > 0 ? current_knowledge.join(', ') : 'Basic Programming and Logic';
        const prereqStr = Array.isArray(missing_prerequisites) && missing_prerequisites.length > 0 ? missing_prerequisites.join(', ') : 'Advanced Computer Science Concepts';

        const prompt = `You are a strict, elite academic examiner designing an inescapable "Skill Scanner" screening test.

Generate exactly TWO advanced theoretical Multiple Choice Questions (MCQs) mapped directly to the user's intelligence profile.

QUESTION 1:
Must test an advanced, theoretical concept bounding their CURRENT KNOWLEDGE: ${currentStr}

QUESTION 2:
Must test an advanced, theoretical concept bounding the MISSING PREREQUISITES for what they want to learn next: ${prereqStr}

Both questions MUST test deep underlying theory or math, NOT superficial syntax.

Return ONLY a valid JSON object matching this EXACT format:
{
  "questions": [
    {
        "concept": "The core theory being tested",
        "question": "The tough theoretical question for Question 1",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "A 2-sentence strict academic explanation."
    },
    {
        "concept": "The core theory being tested",
        "question": "The tough theoretical question for Question 2",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 2,
        "explanation": "A 2-sentence strict academic explanation."
    }
  ]
}
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite academic examiner testing fundamental theory. You output only strict JSON format.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const output = completion.choices[0]?.message?.content || '{"questions": []}';
        const parsed = JSON.parse(output);

        if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length < 2) {
            throw new Error("AI failed to generate exactly 2 questions sequence.");
        }

        return NextResponse.json(parsed.questions.slice(0, 2));

    } catch (error: unknown) {
        console.error('Assessment Generation Error:', error);
        return NextResponse.json(
            { error: (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
