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
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
        }

        const prompt = `You are an elite, strict Chief Technology Officer acting as a mentor.
The user has provided their career ambitions, current tech stack, and their target skills:

USER INPUT:
${text}

Your task:
Analyze their input and generate a highly structured, strict, chronological "Engineering Syllabus". This Syllabus will act as the single source of truth for their training on this platform.

Extract the following key insights:
1. "current_knowledge": An array of strings representing what they already know.
2. "missing_prerequisites": An array of strings representing fundamental concepts or technologies they MUST learn before they can achieve their target skills.
3. "industry_trends": An array of strings describing 3-4 hot, industry-relevant technologies related to their ambition that they should keep an eye on.
4. "skills": An array of strings for the core technologies they will learn on this platform.
5. "nodes": A 4-phase structured learning roadmap.

Return ONLY a valid JSON object matching this EXACT structure (no markdown, no explanation):
{
  "summary": "A 2-sentence brutal but encouraging assessment of what it takes to get from their current tech stack to their ambition.",
  "current_knowledge": ["CurrentTech1", "CurrentTech2"],
  "missing_prerequisites": ["MissingConcept1", "MissingConcept2"],
  "industry_trends": ["Trend1", "Trend2"],
  "skills": ["TargetTech1", "TargetTech2"],
  "nodes": [
    {
      "phase": 1,
      "title": "Phase title (e.g., 'Foundational Architecture')",
      "description": "What they will master in this phase (2-3 sentences)",
      "milestone": "One concrete engineering project they must build to pass this phase"
    },
    { "phase": 2, ... },
    { "phase": 3, ... },
    { "phase": 4, ... }
  ],
  "capstone": {
    "name": "Final Capstone Project",
    "description": "A 2-sentence description of the ultimate project that fulfills their ambition."
  }
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite CTO mentor. Output valid JSON only. No extra text or markdown blocks.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const output = completion.choices[0]?.message?.content || '{}';
        const syllabusData = JSON.parse(output);

        if (!syllabusData.skills || !Array.isArray(syllabusData.nodes)) {
            return NextResponse.json(
                { error: 'AI returned an invalid syllabus structure. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(syllabusData);

    } catch (error: unknown) {
        console.error('Syllabus Generation Error:', error);
        return NextResponse.json(
            { error: (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
