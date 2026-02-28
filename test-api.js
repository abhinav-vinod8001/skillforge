const Groq = require('groq-sdk');
require('dotenv').config({ path: '.env.local' });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const userSkills = "React, JavaScript";

async function test() {
    console.log("Starting test...");
    const prompt = `You are a chaotic senior software architect generating a "Broken Code Escape Room" to train a junior developer.

User's Training Focus: ${userSkills}

Generate ONE highly realistic, incredibly messy file of code (e.g., a React component, a Python script, or an API route based on their skills).

CRUCIAL REQUIREMENT 1: The code you generate MUST be heavily inspired by a REAL-WORLD software industry disaster, a famous CVE, a known OWASP Top 10 vulnerability, or a documented engineering post-mortem.

CRUCIAL REQUIREMENT 2: Present the scenario as an investigative logic PUZZLE. Create deeply twisted, problematic logic and spaghetti architecture with exactly 3 major flaws.

OUTPUT FORMAT: You MUST wrap your response in these exact XML tags. Do NOT use markdown code blocks or JSON. Use raw text.

<title>A witty title for this mission</title>
<description>A 3-4 sentence technical brief explaining the real-world context and explicitly stating which CVE or industry problem this simulates.</description>
<initialCode>
Write the full flawed source code here (around 40-70 lines). Do NOT escape quotes, just write raw code.
</initialCode>
<mission1>Give a puzzle-like clue to the first flaw</mission1>
<mission2>Give a clue to the second flaw</mission2>
<mission3>Give a clue to the third flaw</mission3>`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an elite code puzzle generator. Adhere strictly to the requested XML tag format.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
        });

        const output = completion.choices[0]?.message?.content || '';

        // Safely extract content between XML tags using regex
        const extract = (tag) => {
            const match = output.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
            return match ? match[1].trim() : '';
        };

        const title = extract('title');
        const description = extract('description');
        const initialCode = extract('initialCode');
        const mission1 = extract('mission1');
        const mission2 = extract('mission2');
        const mission3 = extract('mission3');

        if (!title || !initialCode || !mission1) {
            console.error("Failed to extract XML tags. Raw Ouptut:", output);
            throw new Error("AI failed to format the challenge correctly.");
        }

        const projectData = {
            title,
            description,
            initialCode,
            missions: [mission1, mission2, mission3]
        };

        console.log("SUCCESSFULLY GENERATED XML PAYLOAD!");
        console.log("Title:", projectData.title);
        console.log("Missions count:", projectData.missions.length);
        console.log("Code Preview:", projectData.initialCode.substring(0, 50) + '...');

    } catch (e) {
        console.error("GROQ API ERROR:", e);
    }
}

test();
