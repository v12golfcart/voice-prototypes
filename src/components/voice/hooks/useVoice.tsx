'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceState, VoiceSession, VoiceMessage, VoiceProvider } from '@/lib/voice/types';
import { getVoiceConfig } from '@/lib/voice/config';
import { ElevenLabsProvider } from '@/lib/voice/providers/elevenlabs';

export function useVoice(prototype: string) {
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
      
      // Use real transcription
      const transcription = await (providerRef.current as any).transcribeAudio(audioBlob);
      
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
      
      // Generate speech for AI response
      const speechUrl = await providerRef.current.synthesizeSpeech(aiResponse);
      
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

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process recording'
      }));
    }
  }, []);

  // Play audio
  const playAudio = useCallback((audioUrl: string) => {
    setState(prev => ({ ...prev, isPlaying: true }));
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(audioUrl);
    audioRef.current.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };
    audioRef.current.onerror = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        error: 'Failed to play audio'
      }));
    };
    
    audioRef.current.play().catch(error => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        error: 'Failed to play audio'
      }));
    });
  }, []);

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