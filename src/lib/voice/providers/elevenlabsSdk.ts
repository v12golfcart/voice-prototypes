import { BaseVoiceProvider } from './base';
import { VoiceConfig } from '../types';

interface ElevenConversation {
  endSession: () => Promise<void>;
  setMuted: (mute: boolean) => Promise<void> | void;
}

export class ElevenLabsSdkProvider extends BaseVoiceProvider {
  name = 'elevenlabs-sdk';
  private conversation: ElevenConversation | null = null;
  private onActivity?: (msg: string) => void;

  async initialize(config: VoiceConfig): Promise<void> {
    this.config = config;
  }

  /**
   * Starts / (re)unmutes the SDK conversation. Caller may supply an activity callback for audit-logging.
   */
  async startRecording(onActivity?: (msg: string) => void): Promise<void> {
    this.onActivity = onActivity;

    // First invocation: start a brand-new session
    if (!this.conversation) {
      if (!this.config) throw new Error('Provider not initialized');
      const agentId = (this.config.settings as Record<string, unknown>)?.agentId as string;
      if (!agentId) throw new Error('Missing agentId in config.settings');

      // Ensure mic permission is granted (SDK will also prompt, but we pre-ask so UI remains consistent)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { Conversation } = await import('@elevenlabs/client');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.conversation = await (Conversation as any).startSession({
        agentId,
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          if (mode.mode === 'speaking') {
            this.onActivity?.('assistant starts speaking');
          }
        },
        onError: (err: unknown) => {
          console.error('[11Labs SDK] conversation error', err);
        },
      }) as unknown as ElevenConversation;
    } else {
      // Subsequent turns: just un-mute
      await this.conversation.setMuted?.(false);
    }
  }

  /**
   * Mutes the microphone. The SDK keeps the websocket open so the agent can reply.
   */
  async stopRecording(): Promise<Blob> {
    if (this.conversation) {
      await this.conversation.setMuted?.(true);
    }

    // Return empty blob to satisfy hook signature
    return new Blob();
  }

  // The following methods are NO-OPs for the SDK provider because the agent handles them internally.
  async synthesizeSpeech(): Promise<string> {
    throw new Error('synthesizeSpeech is managed internally by ElevenLabs SDK');
  }

  async processMessage(): Promise<string> {
    throw new Error('processMessage is managed internally by ElevenLabs SDK');
  }

  cleanup(): void {
    try {
      this.conversation?.endSession();
    } catch {
      /* ignore */
    }
    this.conversation = null;
  }
} 