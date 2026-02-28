import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY is missing');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // For the Prompt Lab, we want the AI to act completely raw,
        // so we don't apply a heavy system prompt. We just let the user's prompt drive behavior.
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant. Answer the user directly based purely on their prompt. Do not add conversational filler unless instructed to.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error in Prompt Lab:', errorText);
            throw new Error('Groq API failed');
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || 'No response generated.';

        return NextResponse.json({ reply });

    } catch (error: unknown) {
        console.error('Error in Prompt Lab API:', error);
        return NextResponse.json(
            { error: 'Internal server error while processing prompt.' },
            { status: 500 }
        );
    }
}
