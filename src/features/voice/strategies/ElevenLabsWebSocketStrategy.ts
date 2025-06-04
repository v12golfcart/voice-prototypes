export interface StreamingCallbacks {
  onPartial?: (text: string) => void;
}

export class ElevenLabsWebSocketStrategy {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private finalTranscript = '';
  private callbacks: StreamingCallbacks;

  constructor(callbacks: StreamingCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async start() {
    // Open WS first
    this.ws = new WebSocket('/api/voice/elevenlabs/stream');
    this.ws.binaryType = 'arraybuffer';

    this.ws.onmessage = (e: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === 'transcript_partial' && this.callbacks.onPartial) {
          this.callbacks.onPartial(msg.text);
        }
        if (msg.type === 'transcript_final') {
          this.finalTranscript += msg.text + ' ';
        }
      } catch {
        // non-JSON payloads ignored
      }
    };

    // Wait until WS open before streaming audio
    await new Promise<void>((resolve) => {
      if (this.ws!.readyState === WebSocket.OPEN) return resolve();
      this.ws!.onopen = () => resolve();
    });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0); // Float32Array
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(pcm16.buffer);
      }
    };
  }

  async stop(): Promise<string> {
    // Stop audio nodes
    this.processor?.disconnect();
    this.sourceNode?.disconnect();
    await this.audioCtx?.close();

    // Tell upstream we are done
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event: 'stop' }));
    }

    // Wait for final transcript message or 1s timeout
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    this.ws?.close();
    return this.finalTranscript.trim();
  }

  cleanup() {
    try { this.ws?.close(); } catch {
      /* ignore */
    }
    this.processor?.disconnect();
    this.sourceNode?.disconnect();
    this.audioCtx?.close();
  }
} 