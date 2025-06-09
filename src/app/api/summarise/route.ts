import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return NextResponse.json({ error: 'Missing OpenAI key' }, { status: 500 });
    }

    // Build transcript text
    const transcript = messages
      .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.text}`)
      .join('\n');

    // Debug: log transcript being summarised
    // eslint-disable-next-line no-console
    console.log('[Summarise] Transcript:', transcript);

    const systemPrompt = `You are an AI research assistant. Generate a concise research summary in STRICT JSON with the following keys:\n\n- themes: array of short strings (2–4 words)\n- concise_summary: max 40 words\n- quote: the single most illustrative sentence from the user (verbatim)\n\nReturn ONLY the JSON.`;

    const payload = {
      model: 'gpt-3.5-turbo-0125',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
    };

    // Debug: log payload we will send to OpenAI (without key)
    // eslint-disable-next-line no-console
    console.log('[Summarise] OpenAI payload:', JSON.stringify(payload));

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';

    // Debug: log raw content from OpenAI
    // eslint-disable-next-line no-console
    console.log('[Summarise] OpenAI raw response:', content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return NextResponse.json({ summary: parsed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
} 