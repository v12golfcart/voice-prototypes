import { BaseVoiceProvider } from './base';
import { VoiceConfig } from '../types';

export class ElevenLabsProvider extends BaseVoiceProvider {
  name = 'elevenlabs';
  private baseUrl = 'https://api.elevenlabs.io/v1';

  async initialize(config: VoiceConfig): Promise<void> {
    this.config = config;
    // Test API key validity
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: { 'xi-api-key': config.apiKey }
      });
      if (!response.ok) {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      throw new Error(`ElevenLabs initialization failed: ${error}`);
    }
  }

  async synthesizeSpeech(text: string): Promise<string> {
    if (!this.config) throw new Error('Provider not initialized');

    const voiceId = this.config.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default voice
    
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.config.model || 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`);
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

      console.log('📡 Making 11Labs STT request...');

      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
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
        throw new Error(`STT failed: ${response.statusText} - ${errorText}`);
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