'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceState, VoiceSession, VoiceMessage, VoiceProvider } from '@/lib/voice/types';
import { getVoiceConfig } from '@/lib/voice/config';
import { ElevenLabsProvider } from '@/lib/voice/providers/elevenlabs';

export function useVoice(prototype: string, options?: { onActivity?: (message: string) => void }) {
  const { onActivity } = options || {};

  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    currentSession: null,
    error: null,
  });

  const providerRef = useRef<VoiceProvider | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize provider
  const initializeProvider = useCallback(async () => {
    try {
      const config = getVoiceConfig(prototype);
      
      // Create provider based on config
      switch (config.provider) {
        case 'elevenlabs':
          providerRef.current = new ElevenLabsProvider();
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      await providerRef.current.initialize(config);
      
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize voice provider'
      }));
    }
  }, [prototype]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!providerRef.current) {
      await initializeProvider();
    }

    try {
      setState(prev => ({ ...prev, isRecording: true, error: null }));
      
      // Create new session if none exists
      if (!state.currentSession) {
        const newSession: VoiceSession = {
          id: `session_${Date.now()}`,
          prototype,
          messages: [],
          status: 'recording',
          startedAt: new Date(),
        };
        setState(prev => ({ ...prev, currentSession: newSession }));
      }

      await providerRef.current!.startRecording();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      }));
    }
  }, [prototype, state.currentSession, initializeProvider]);

  // Stop recording and process
  const stopRecording = useCallback(async () => {
    if (!providerRef.current) return;

    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      const audioBlob = await providerRef.current.stopRecording();
      
      // Use real transcription - cast to ElevenLabsProvider for transcription method
      const provider = providerRef.current as ElevenLabsProvider;
      const transcription = await provider.transcribeAudio(audioBlob);
      
      onActivity?.(`STT -- text is generated: "${transcription}"`);
      
      // Add user message
      const userMessage: VoiceMessage = {
        id: `msg_${Date.now()}`,
        type: 'user',
        content: transcription,
        timestamp: new Date(),
        audioUrl: URL.createObjectURL(audioBlob),
      };

      // Process with AI
      const aiResponse = await providerRef.current.processMessage(transcription);
      
      onActivity?.('Process -- text is finished processing');

      // Request speech synthesis
      onActivity?.('TTS -- speech generation requested');

      const speechUrl = await providerRef.current.synthesizeSpeech(aiResponse);

      onActivity?.('TTS -- speech generation finished');
      
      // Add AI message
      const aiMessage: VoiceMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        audioUrl: speechUrl,
      };

      // Update session
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          messages: [...prev.currentSession.messages, userMessage, aiMessage],
          status: 'idle',
        } : null,
      }));

      // Auto-play AI response
      playAudio(speechUrl);

    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        isProcessing: false,
        error: err instanceof Error ? err.message : 'Failed to process recording'
      }));
    }
  }, [onActivity]);

  // Play audio
  const playAudio = useCallback((audioUrl: string) => {
    setState(prev => ({ ...prev, isPlaying: true }));

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(audioUrl);

    audioRef.current.onplay = () => {
      onActivity?.('TTS -- speech playback started');
    };

    audioRef.current.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onActivity?.('TTS -- speech playback finished');
    };

    audioRef.current.onerror = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        error: 'Failed to play audio'
      }));
    };

    audioRef.current.play().catch(() => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        error: 'Failed to play audio'
      }));
    });
  }, [onActivity]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.cleanup();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    playAudio,
    initializeProvider,
  };
}