import { SYS } from '@/lib/prompt';

// The system prompt lives on the server only — the client sends just the conversation,
// so this endpoint can't be used as an open proxy to the Gemini key with a custom prompt.
const MAX_MESSAGES = 6;
const MAX_CHARS = 4000;

export async function POST(request) {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const valid =
        messages.length > 0 &&
        messages.length <= MAX_MESSAGES &&
        messages.every((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length <= MAX_CHARS);
    if (!valid) return Response.json({ error: 'Please keep your brief under 4,000 characters.' }, { status: 400 });

    const contents = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYS }] },
                contents,
                generationConfig: { maxOutputTokens: 2000 },
            }),
        }
    );

    const data = await res.json();

    if (!res.ok) {
        return Response.json({ error: data.error?.message || 'Gemini API error' }, { status: res.status });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('');
    return Response.json({ text });
}
