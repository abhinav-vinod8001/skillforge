import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Helper to distribute load across available keys
const getGroqKey = () => {
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_SECURITY,
        process.env.GROQ_API_KEY_PERFORMANCE,
        process.env.GROQ_API_KEY_UX
    ].filter(Boolean);
    return keys[Math.floor(Math.random() * keys.length)];
};

export async function POST(request: Request) {
    const groq = new Groq({
        apiKey: getGroqKey() || process.env.GROQ_API_KEY,
    });

    try {
        const { skills, trends } = await request.json();

        if (!skills || !trends) {
            return NextResponse.json({ error: 'Skills and trends are required' }, { status: 400 });
        }

        const skillList = Array.isArray(skills) ? skills.join(', ') : String(skills);
        const trendSummary = Array.isArray(trends)
            ? trends.map((t: { skill_name: string; growth_percentage: number; demand_level: string; context: string }) =>
                `${t.skill_name} (+${t.growth_percentage}% growth, ${t.demand_level} demand - ${t.context})`
            ).join('\n')
            : JSON.stringify(trends);

        const prompt = `You are an elite career coach creating a highly personalized learning roadmap.

USER'S CURRENT SKILLS (from their syllabus/curriculum):
${skillList}

CURRENT HOT MARKET TRENDS (tailored to the user):
${trendSummary}

Your task:
1. Identify the BEST skill gap to bridge — select exactly ONE trending skill from the "CURRENT HOT MARKET TRENDS" list provided above that is closest to what the user already knows.
2. Create a focused, realistic 4-week roadmap that bridges their EXISTING skills with that EXACT trending skill to make them highly marketable right now.
3. Each week should build on the previous, with concrete, actionable tasks. Do not just suggest reading; mandate hands-on coding and project building.
4. The capstone project MUST combine their existing skills with the chosen new trending skill perfectly.

Return ONLY a valid JSON object matching this EXACT structure (no markdown, no explanation):
{
  "focus_trend": "The specific trending skill they should learn",
  "reason": "2-3 sentences explaining why this is the perfect fit given their background",
  "weeks": [
    {
      "week": 1,
      "title": "Week title (e.g., 'Foundations of X')",
      "description": "What they will learn and accomplish this week (2-3 sentences)",
      "resource": "Specific free resource (e.g., 'fast.ai Practical Deep Learning course', 'The Rust Book (doc.rust-lang.org)')",
      "action_item": "One concrete deliverable (e.g., 'Build a CRUD REST API with authentication')"
    },
    { "week": 2, ... },
    { "week": 3, ... },
    { "week": 4, ... }
  ],
  "capstone_project": {
    "name": "Project name",
    "description": "A 2-3 sentence description that clearly connects the user's existing skills with the new trending skill"
  }
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite career coach. Output valid JSON only. No extra text.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const output = completion.choices[0]?.message?.content || '{}';
        const roadmapData = JSON.parse(output);

        // Validate structure
        if (!roadmapData.focus_trend || !Array.isArray(roadmapData.weeks) || roadmapData.weeks.length === 0) {
            return NextResponse.json(
                { error: 'AI returned an invalid roadmap structure. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(roadmapData);
    } catch (error: unknown) {
        console.error('Groq API Error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
