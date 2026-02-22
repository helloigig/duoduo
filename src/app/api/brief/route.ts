import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { system, messages, max_tokens } = body

    // Convert Anthropic-format messages → Gemini contents
    const contents = messages.map((msg: { role: string; content: unknown }) => {
      const geminiRole = msg.role === 'assistant' ? 'model' : 'user'
      const content = msg.content

      if (typeof content === 'string') {
        return { role: geminiRole, parts: [{ text: content }] }
      }

      if (Array.isArray(content)) {
        const parts = content.map((part: { type: string; text?: string; source?: { media_type: string; data: string } }) => {
          if (part.type === 'text') return { text: part.text || '' }
          if (part.type === 'image' && part.source) {
            return { inlineData: { mimeType: part.source.media_type, data: part.source.data } }
          }
          return { text: '' }
        })
        return { role: geminiRole, parts }
      }

      return { role: geminiRole, parts: [{ text: String(content) }] }
    })

    const geminiBody: Record<string, unknown> = {
      contents,
      generationConfig: { maxOutputTokens: max_tokens || 1000 },
    }

    if (system) {
      geminiBody.systemInstruction = { parts: [{ text: system }] }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    )

    const data = await response.json()

    // Extract text and return in Anthropic-compatible format that page.tsx expects
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return NextResponse.json({ content: [{ type: 'text', text }] })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to reach Gemini API' }, { status: 500 })
  }
}
