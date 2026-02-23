export async function POST(request) {
    const { messages, system } = await request.json();

    // Convert from Anthropic-style messages to Gemini format
    const contents = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: Array.isArray(msg.content)
            ? msg.content.map((part) => {
                  if (part.type === 'text') return { text: part.text };
                  if (part.type === 'image')
                      return { inlineData: { mimeType: part.source.media_type, data: part.source.data } };
                  return { text: '' };
              })
            : [{ text: msg.content }],
    }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: system }] },
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
    console.log('[brief] raw text:', text);
    return Response.json({ text });
}
