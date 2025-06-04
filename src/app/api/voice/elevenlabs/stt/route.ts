import { NextResponse } from 'next/server';

const BASE_URL = 'https://api.elevenlabs.io/v1';

export const runtime = 'edge'; // quicker cold starts for streaming TTS/STT

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    // raw body passthrough to ElevenLabs
    const body = req.body;
    const upstreamRes = await fetch(`${BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': contentType,
      },
      body,
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      return NextResponse.json({ error: text || 'STT failed' }, { status: upstreamRes.status });
    }

    const json = await upstreamRes.json();
    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Unexpected error' }, { status: 500 });
  }
} 