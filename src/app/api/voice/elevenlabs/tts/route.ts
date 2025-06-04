import { NextResponse } from 'next/server';

const BASE_URL = 'https://api.elevenlabs.io/v1';

export async function POST(req: Request) {
  try {
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB', modelId = 'eleven_monolingual_v1' } = await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
    }

    const upstreamRes = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      return NextResponse.json({ error: errorText }, { status: upstreamRes.status });
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const contentType = upstreamRes.headers.get('content-type') || 'audio/mpeg';

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Unexpected error' }, { status: 500 });
  }
} 