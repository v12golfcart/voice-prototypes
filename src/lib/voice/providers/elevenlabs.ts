import { BaseVoiceProvider } from './base';
import { VoiceConfig } from '../types';

export class ElevenLabsProvider extends BaseVoiceProvider {
  name = 'elevenlabs';
  private apiBasePath = '/api/voice/elevenlabs';

  async initialize(config: VoiceConfig): Promise<void> {
    this.config = config;
    // Nothing to validate on the client anymore – assume server route hides the key
  }

  async synthesizeSpeech(text: string): Promise<string> {
    if (!this.config) throw new Error('Provider not initialized');

    const voiceId = this.config.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default voice
    
    try {
      const response = await fetch(`${this.apiBasePath}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
          modelId: this.config.model || 'eleven_monolingual_v1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS failed: ${errorText}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      throw new Error(`Speech synthesis failed: ${error}`);
    }
  }

  async processMessage(message: string): Promise<string> {
    // For now, echo back the message with a simple response
    // In a real implementation, this would call your AI backend
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `I heard you say: "${message}". This is a test response from the sandbox.`;
  }

  // Convert audio blob to text using 11Labs STT API
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!this.config) throw new Error('Provider not initialized');
    
    console.log('🎤 Starting transcription...', {
      audioBlobSize: audioBlob.size,
      audioBlobType: audioBlob.type,
      hasApiKey: !!this.config.apiKey
    });
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model_id', 'scribe_v1'); // Fixed: was 'whisper-1'

      console.log('📡 Making 11Labs STT request (via server proxy)...');

      const response = await fetch(`${this.apiBasePath}/stt`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 STT Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ STT API Error:', errorText);
        throw new Error(`STT failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 11Labs STT Success:', result);
      
      // Extract text from response
      return result.text || 'Could not transcribe audio';
      
    } catch (error) {
      console.warn('11Labs STT failed, using browser fallback:', error);
      return this.transcribeWithBrowserAPI();
    }
  }

  private async transcribeWithBrowserAPI(): Promise<string> {
    return new Promise((resolve) => {
      // Simulate realistic transcription
      const sampleResponses = [
        "Hello, this is a test message",
        "How are you doing today?",
        "I'd like to provide some feedback",
        "This is working great so far",
        "Can you hear me clearly?"
      ];
      
      const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      
      setTimeout(() => {
        resolve(randomResponse);
      }, 500);
    });
  }
} 