import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { skills, trends } = await request.json();

        if (!skills || !trends) {
            return NextResponse.json({ error: 'Skills and trends are required' }, { status: 400 });
        }

        const prompt = `
    Analyze the user's existing technical skills: ${JSON.stringify(skills)}
    Against currently booming market trends: ${JSON.stringify(trends)}
    
    Identify the most valuable learning gap and create a personalized 4-week roadmap.
    The roadmap must culminate in a capstone project that bridges their existing skills with the new trending skill.
    
    Return strictly a JSON object matching this structure:
    {
       "focus_trend": "Trend Name",
       "reason": "Why this trend fits them",
       "weeks": [
          {
            "week": 1,
            "title": "Title",
            "description": "Short description",
            "resource": "e.g., freeCodeCamp or YouTube link idea",
            "action_item": "Task to complete"
          },
          // ... 4 weeks total
       ],
       "capstone_project": {
           "name": "Project Name",
           "description": "Project description combining their skills"
       }
    }`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite career coach. Output JSON only.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const output = completion.choices[0]?.message?.content || '{}';
        const roadmapData = JSON.parse(output);

        return NextResponse.json(roadmapData);
    } catch (error: unknown) {
        console.error('Groq API Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
