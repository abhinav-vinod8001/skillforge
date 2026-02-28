const Groq = require('groq-sdk');
require('dotenv').config({ path: '.env.local' });

async function testKeys() {
    const keys = {
        'GROQ_API_KEY': process.env.GROQ_API_KEY,
        'SECURITY': process.env.GROQ_API_KEY_SECURITY,
        'PERFORMANCE': process.env.GROQ_API_KEY_PERFORMANCE,
        'UX': process.env.GROQ_API_KEY_UX
    };

    for (const [name, key] of Object.entries(keys)) {
        if (!key) {
            console.log(`[${name}] is missing in .env.local`);
            continue;
        }

        const groq = new Groq({ apiKey: key });
        try {
            await groq.chat.completions.create({
                messages: [{ role: 'user', content: 'Ping' }],
                model: 'llama-3.3-70b-versatile',
                max_tokens: 5
            });
            console.log(`[${name}] ✅ ALIVE AND HAS TOKENS FOR 70B`);
        } catch (e) {
            console.log(`[${name}] ❌ ERROR: ${e.status} ${e.error?.error?.code || e.message}`);
        }
    }
}

testKeys();
