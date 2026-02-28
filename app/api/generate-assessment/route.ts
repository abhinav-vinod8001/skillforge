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
        const userSkills = Array.isArray(skills) && skills.length > 0 ? skills.join(', ') : 'Computer Science, Mathematics, Programming';

        const prompt = `You are a strict, elite academic examiner designing an inescapable "Skill Scanner" screening test.
The candidate claims to have these skills: ${userSkills}

Pick ONE advanced, theoretical prerequisite concept from their skills (e.g., the math behind neural networks, time complexity of graph algorithms, the consensus mechanism of blockchains, or the fundamental theory behind React's Virtual DOM).
Generate a tough Multiple Choice Question (MCQ) with 4 options. The question must test the deep underlying theory or math, NOT superficial syntax.

OUTPUT FORMAT: Wrap your response in exactly these XML tags. Do NOT use markdown outside the tags.

<concept>The core theory being tested</concept>
<question>The tough theoretical question</question>
<option0>First possible answer</option0>
<option1>Second possible answer</option1>
<option2>Third possible answer</option2>
<option3>Fourth possible answer</option3>
<correct_index>0, 1, 2, or 3</correct_index>
<explanation>A 2-sentence strict academic explanation of why the correct answer is right and the others are wrong.</explanation>`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite academic examiner testing fundamental theory. You output only strict XML format.' },
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

        const concept = extract('concept') || 'Fundamental Theory';
        const question = extract('question') || 'What is the foundational underlying mechanism?';
        const options = [
            extract('option0') || 'Option A',
            extract('option1') || 'Option B',
            extract('option2') || 'Option C',
            extract('option3') || 'Option D'
        ];
        // Ensure correct index is parsed as an integer between 0 and 3
        const correctIndexMatch = extract('correct_index');
        const correctIndex = correctIndexMatch ? parseInt(correctIndexMatch, 10) : 0;
        const validCorrectIndex = isNaN(correctIndex) ? 0 : Math.max(0, Math.min(3, correctIndex));

        const explanation = extract('explanation') || 'The chosen option correctly addresses the principal theory.';

        return NextResponse.json({
            concept,
            question,
            options,
            correctIndex: validCorrectIndex,
            explanation
        });

    } catch (error: unknown) {
        console.error('Assessment Generation Error:', error);
        return NextResponse.json(
            { error: (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
