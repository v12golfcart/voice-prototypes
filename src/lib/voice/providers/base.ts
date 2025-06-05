import { VoiceProvider, VoiceConfig } from '../types';

export abstract class BaseVoiceProvider implements VoiceProvider {
  abstract name: string;
  protected config?: VoiceConfig;
  protected mediaRecorder?: MediaRecorder;
  protected audioChunks: Blob[] = [];

  abstract initialize(config: VoiceConfig): Promise<void>;
  abstract synthesizeSpeech(text: string): Promise<string>;
  abstract processMessage(message: string): Promise<string>;

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000);
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mime });
        this.audioChunks = [];
        
        // Stop all tracks to release microphone
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = undefined;
    }
    this.audioChunks = [];
  }
} 