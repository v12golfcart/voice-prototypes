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
  private hasLoggedSpeech = false;

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
      const settings = this.config.settings as Record<string, unknown> | undefined;
      const agentId = settings?.agentId as string;
      if (!agentId) throw new Error('Missing agentId in config.settings');

      // Optional placeholders that can be supplied via settings.
      const scenario = settings?.scenario as string | undefined;
      const firstMessage = (settings?.first_message || settings?.firstMessage) as string | undefined;

      // Ensure mic permission is granted; stop tracks right away so we don't keep an extra open stream.
      try {
        const permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permStream.getTracks().forEach(track => track.stop());
      } catch {
        /* permission denied handled by SDK later */
      }

      const { Conversation } = await import('@elevenlabs/client');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.conversation = await (Conversation as any).startSession({
        agentId,
        ...(scenario ? { scenario } : {}),
        ...(firstMessage ? { first_message: firstMessage } : {}),
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          if (mode.mode === 'speaking') {
            this.onActivity?.('assistant starts speaking');
            this.hasLoggedSpeech = false; // reset for next user turn
          }
          if (mode.mode === 'listening') {
            this.onActivity?.('agent listening – your turn');
            this.hasLoggedSpeech = false;
          }
        },
        onMessage: (msg: unknown) => {
          console.debug('[11Labs SDK] onMessage', msg);
          try {
            const evt = msg as Record<string, unknown>;
            if (evt?.type === 'vad_score') {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const score = (evt as any).vad_score_event?.vad_score as number | undefined;
              /* eslint-enable */
              console.debug('[11Labs SDK] VAD score', score);
              if (!this.hasLoggedSpeech && typeof score === 'number' && score > 0.2) {
                this.onActivity?.('user starts speaking');
                this.hasLoggedSpeech = true;
              }
            }
          } catch {/* ignore */}
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
      try {
        await this.conversation.endSession();
      } finally {
        this.conversation = null;
      }
    }
    // Return placeholder blob – not used by SDK path
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