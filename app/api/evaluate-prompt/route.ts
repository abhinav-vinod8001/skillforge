import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt, scenario, objective } = await req.json();

        if (!prompt || !scenario || !objective) {
            return NextResponse.json({ error: 'prompt, scenario, and objective are required' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const evaluationSystemPrompt = `You are an expert Prompt Engineering instructor and evaluator. Your role is to assess a student's prompt based on a given scenario and objective.

Evaluate the student's prompt on THREE dimensions and respond ONLY with valid JSON:

{
  "clarity": <integer 0-100 representing how clear and unambiguous the prompt is>,
  "specificity": <integer 0-100 representing how specific, concrete, and detailed the prompt is>,
  "effectiveness": <integer 0-100 representing how likely the prompt is to achieve the stated objective>,
  "total": <weighted average: clarity*0.3 + specificity*0.35 + effectiveness*0.35, rounded to integer>,
  "feedback": "<2-3 sentences of constructive narrative feedback about the prompt's strengths and main weakness>",
  "suggestions": [
    "<specific actionable suggestion 1>",
    "<specific actionable suggestion 2>",
    "<specific actionable suggestion 3>"
  ]
}

Rules:
- Be rigorous but fair. A score of 80+ means the prompt is genuinely well-engineered.
- Vague prompts should score below 50 on Specificity.
- Always give 3 concrete suggestions, even for high-scoring prompts.
- DO NOT include any text outside the JSON object.`;

        const userEvalPrompt = `Scenario:
${scenario}

Objective:
${objective}

Student's Prompt to Evaluate:
"""
${prompt}
"""

Evaluate the student's prompt and respond with the JSON evaluation object.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: evaluationSystemPrompt },
                    { role: 'user', content: userEvalPrompt }
                ],
                temperature: 0.3, // Low temp for consistent scoring
                max_tokens: 800,
                response_format: { type: 'json_object' } // Enforce JSON output
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error in evaluate-prompt:', errorText);
            throw new Error('Groq API failed');
        }

        const data = await response.json();
        const rawContent = data.choices[0]?.message?.content || '{}';

        let result;
        try {
            result = JSON.parse(rawContent);
        } catch {
            console.error('Failed to parse Groq JSON:', rawContent);
            throw new Error('Failed to parse evaluation response');
        }

        // Validate and sanitize the result
        const sanitized = {
            clarity: Math.min(100, Math.max(0, Number(result.clarity) || 0)),
            specificity: Math.min(100, Math.max(0, Number(result.specificity) || 0)),
            effectiveness: Math.min(100, Math.max(0, Number(result.effectiveness) || 0)),
            total: Math.min(100, Math.max(0, Number(result.total) || 0)),
            feedback: String(result.feedback || 'No feedback provided.'),
            suggestions: Array.isArray(result.suggestions)
                ? result.suggestions.slice(0, 3).map(String)
                : ['Try to be more specific.', 'Add a clear output format.', 'Define the expected role clearly.']
        };

        return NextResponse.json(sanitized);

    } catch (error: unknown) {
        console.error('Error in evaluate-prompt API:', error);
        return NextResponse.json({
            clarity: 0, specificity: 0, effectiveness: 0, total: 0,
            feedback: 'Evaluation failed. Please try again.',
            suggestions: ['Ensure your prompt is clear.', 'Add more context.', 'Define the output format.']
        }, { status: 500 });
    }
}
