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
        const { syllabus } = body;
        const syllabusString = syllabus && Object.keys(syllabus).length > 0 ? JSON.stringify(syllabus).substring(0, 1000) : 'General Technology';

        const prompt = `You are an elite AI Prompt Engineering gamification engine.
The user is training on a strict engineering syllabus: ${syllabusString}

Generate a unique 1-step prompt engineering workplace scenario perfectly tailored ONLY for the topics in this Syllabus.

Guidelines:
- If the syllabus focuses on React/Frontend → generate a challenge about prompting an AI to review UI components.
- If it focuses on Backend/Database → generate a challenge about writing database constraints or optimizing queries.
- Do NOT generate generic questions. Tie the scenario directly to one of their specific syllabus nodes!

OUTPUT FORMAT: Wrap your response in these exact XML tags. Do NOT use JSON or markdown.

<id>a-unique-kebab-case-id</id>
<title>A compelling challenge title</title>
<category>The domain category (e.g., "Frontend AI", "Data Engineering", "DevOps")</category>
<difficulty>Beginner or Intermediate or Advanced</difficulty>
<icon>A single emoji icon</icon>
<scenario>A detailed 3-5 sentence scenario describing a real-world workplace situation where the student needs to craft a perfect AI prompt. Make it specific to their skills.</scenario>
<objective>One sentence describing exactly what the student's prompt must achieve.</objective>
<disruption>A twist that changes the requirements mid-task (start with ⚡ Disruption:). This tests adaptability.</disruption>
<tags>Tag1, Tag2, Tag3</tags>`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite prompt engineering instructor. Adhere strictly to the requested XML tag format.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.8,
        });

        const output = completion.choices[0]?.message?.content || '';

        const extract = (tag: string) => {
            const match = output.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
            return match ? match[1].trim() : '';
        };

        const id = extract('id') || `challenge-${Date.now()}`;
        const title = extract('title');
        const category = extract('category');
        const difficulty = extract('difficulty') || 'Intermediate';
        const icon = extract('icon') || '🎯';
        const scenario = extract('scenario');
        const objective = extract('objective');
        const disruption = extract('disruption');
        const tagsRaw = extract('tags');
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : ['Prompting'];

        if (!title || !scenario || !objective) {
            console.error('Failed to extract XML tags. Raw output:', output);
            throw new Error('AI failed to format the challenge correctly.');
        }

        return NextResponse.json({
            id,
            title,
            category,
            difficulty,
            icon,
            scenario,
            objective,
            disruption: disruption || '⚡ Disruption: The client now wants the output in a completely different format. Adapt your prompt.',
            tags,
            maxScore: 100,
        });
    } catch (error: unknown) {
        console.error('Challenge Generation Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
