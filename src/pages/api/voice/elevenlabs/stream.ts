export const config = {
  runtime: 'edge',
};

import { NextResponse } from 'next/server';

// ElevenLabs streaming STT WebSocket endpoint
const ELEVENLABS_STT_WS = 'wss://api.elevenlabs.io/v1/speech-to-text/stream';

export default async function handler(req: Request) {
  // Ensure this is a WebSocket upgrade request
  const upgradeHeader = req.headers.get('upgrade') || '';
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return new NextResponse('Expected WebSocket upgrade', { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new NextResponse('Missing ELEVENLABS_API_KEY', { status: 500 });
  }

  // @ts-expect-error WebSocketPair available in Edge runtime
  const { 0: clientSocket, 1: serverSocket } = new WebSocketPair();

  // Establish upstream connection including key via query param
  const upstreamUrl = `${ELEVENLABS_STT_WS}?xi-api-key=${apiKey}`;
  const upstream = new WebSocket(upstreamUrl);

  upstream.addEventListener('open', () => {
    serverSocket.accept();
  });

  // Browser -> ElevenLabs
  clientSocket.addEventListener('message', (event: MessageEvent) => {
    upstream.send(event.data);
  });

  // ElevenLabs -> Browser
  upstream.addEventListener('message', (event: MessageEvent) => {
    try {
      serverSocket.send(event.data);
    } catch {
      upstream.close();
    }
  });

  const closeBoth = () => {
    try {
      clientSocket.close();
    } catch {}
    try {
      upstream.close();
    } catch {}
  };

  upstream.addEventListener('close', closeBoth);
  upstream.addEventListener('error', closeBoth);
  clientSocket.addEventListener('close', closeBoth);
  clientSocket.addEventListener('error', closeBoth);

  // @ts-expect-error webSocket field supported in Edge runtime
  return new NextResponse(null, { status: 101, webSocket: serverSocket });
} 