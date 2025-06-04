import { VoiceConfig } from './types';

// Voice configurations for each prototype
export const voiceConfigs: Record<string, VoiceConfig> = {
  'instant-insight': {
    provider: 'elevenlabs',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Professional, clear voice
    model: 'eleven_monolingual_v1',
    settings: {
      personality: 'helpful-researcher',
      context: 'product-feedback',
      maxDuration: 60, // 1 minute max
    }
  },
  
  'smart-concierge': {
    provider: 'elevenlabs',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Friendly, warm voice
    model: 'eleven_monolingual_v1',
    settings: {
      personality: 'friendly-support',
      context: 'post-purchase',
      maxDuration: 120, // 2 minutes max
    }
  },
  
  'expert-pulse': {
    provider: 'elevenlabs',
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Professional, authoritative
    model: 'eleven_monolingual_v1',
    settings: {
      personality: 'expert-interviewer',
      context: 'market-research',
      maxDuration: 300, // 5 minutes max
    }
  },
  
  'sandbox': {
    provider: 'elevenlabs',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Default voice for testing
    model: 'eleven_monolingual_v1',
    settings: {
      personality: 'experimental',
      context: 'testing',
      maxDuration: 180, // 3 minutes max
    }
  }
};

export function getVoiceConfig(prototype: string): VoiceConfig {
  const config = voiceConfigs[prototype];
  if (!config) {
    throw new Error(`No voice configuration found for prototype: ${prototype}`);
  }
  
  return config;
} 