export interface VoiceConfig {
  provider: 'elevenlabs' | 'vapi';
  apiKey: string;
  voiceId?: string;
  model?: string;
  settings?: Record<string, any>;
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface VoiceSession {
  id: string;
  prototype: string;
  messages: VoiceMessage[];
  status: 'idle' | 'recording' | 'processing' | 'playing' | 'error';
  startedAt: Date;
  endedAt?: Date;
}

export interface VoiceProvider {
  name: string;
  initialize(config: VoiceConfig): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  synthesizeSpeech(text: string): Promise<string>; // Returns audio URL
  processMessage(message: string): Promise<string>; // Returns AI response
  cleanup(): void;
}

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  currentSession: VoiceSession | null;
  error: string | null;
} 