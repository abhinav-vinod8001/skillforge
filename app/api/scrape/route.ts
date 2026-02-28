import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
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

export async function POST(req: Request) {
    const groq = new Groq({
        apiKey: getGroqKey() || process.env.GROQ_API_KEY,
    });

    try {
        const body = await req.json();
        const skills: string[] = body.skills || [];

        if (skills.length === 0) {
            return NextResponse.json({
                trends: [
                    { skill_name: "Agentic AI", growth_percentage: 42, demand_level: "High", context: "Booming in predictive analytics" },
                    { skill_name: "Go (Golang)", growth_percentage: 28, demand_level: "High", context: "Cloud-native microservices" },
                    { skill_name: "DevSecOps", growth_percentage: 35, demand_level: "Medium", context: "Security left-shifting trends" },
                    { skill_name: "Quantum Computing", growth_percentage: 15, demand_level: "Low", context: "Emerging niche research" }
                ]
            });
        }

        const prompt = `Act as an expert career advisor and tech industry analyst.
The user is currently studying the following curriculum/skills:
${skills.join(', ')}

Analyze these topics and identify 4-6 highly specific, booming technologies or market trends that are DIRECTLY RELATED to these subjects. 
For example, if they are studying "Python" and "Data Analysis", a booming trend might be "LLM Fine-tuning" or "RAG systems".
Do not suggest generic trends; they must be personalized and highly relevant to the provided curriculum.

Return strictly a JSON array of objects with the following keys:
- "skill_name": The specific name of the booming skill/technology.
- "growth_percentage": A realistic estimated YoY growth percentage (number between 10 and 80).
- "demand_level": Either "High" or "Medium".
- "context": A short, 5-10 word explanation of why this specific skill is trending in relation to their curriculum.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const output = completion.choices[0]?.message?.content || '{"trends": []}';
        let data;
        try {
            data = JSON.parse(output);
            if (!data.trends && Array.isArray(data)) {
                data = { trends: data };
            } else if (!data.trends && Object.keys(data).length > 0) {
                const firstKey = Object.keys(data)[0];
                data = { trends: data[firstKey] };
            }
        } catch {
            data = {
                trends: [
                    { skill_name: "Advanced " + skills[0], growth_percentage: 40, demand_level: "High", context: "Deepening core competencies" },
                    { skill_name: "Applied " + (skills[1] || "AI"), growth_percentage: 35, demand_level: "Medium", context: "Practical industry applications" }
                ]
            };
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Trend Generation Error:', error);
        return NextResponse.json({
            trends: [
                { skill_name: "Cloud Native Architecture", growth_percentage: 38, demand_level: "High", context: "Standard for modern applications" },
                { skill_name: "Data Engineering", growth_percentage: 42, demand_level: "High", context: "Foundation for AI/ML" }
            ]
        }, { status: 500 });
    }
}
