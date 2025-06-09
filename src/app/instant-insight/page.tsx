'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Stack, Alert, Loader } from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff, IconPlayerPlay, IconAlertCircle } from '@tabler/icons-react';
import { PrototypeLayout } from '@/components/shared/PrototypeLayout';

// ---------------------------------------------------------------------------
//  Split out constants so they are easy to find / edit later
// ---------------------------------------------------------------------------

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_UXR_AGENT_ID || '';

// These will be made editable in a future step. For now they are fixed.
const SCENARIO =
  'You are a researcher for Discord and have been tasked to learn what types of problems people are facing with voice. You are about to connect with a participant who has opted into sharing details after reporting they had a bad experience after leaving a voice call.';
const FIRST_MESSAGE = 'Hello! Can you tell me about the issue you faced?';

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

type Status = 'idle' | 'listening' | 'speaking' | 'error';

interface ElevenConversation {
  endSession: () => Promise<void>;
  setMuted: (mute: boolean) => Promise<void> | void;
}

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function InstantInsightPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<ElevenConversation | null>(null);

  // -----------------------------------------------------------------------
  //  Helpers
  // -----------------------------------------------------------------------

  const startOrResumeSession = useCallback(async () => {
    setError(null);

    if (!AGENT_ID) {
      setError('Missing ElevenLabs agent id');
      setStatus('error');
      return;
    }

    try {
      // Existing active session? Just unmute the mic.
      if (conversationRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof (conversationRef.current as any).setMicMuted === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (conversationRef.current as any).setMicMuted(false);
          } else if (typeof (conversationRef.current as any).setMuted === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (conversationRef.current as any).setMuted(false);
          }
          setStatus('listening');
          return;
        } catch {
          // If unmuting fails we'll start a fresh session below.
          conversationRef.current = null;
        }
      }

      const { Conversation } = await import('@elevenlabs/client');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation = await (Conversation as any).startSession({
        agentId: AGENT_ID,
        // Custom variables exposed to the agent at session start
        dynamicVariables: {
          scenario: SCENARIO,
          first_message: FIRST_MESSAGE,
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          setStatus(mode.mode === 'speaking' ? 'speaking' : 'listening');
        },
        onError: (err: unknown) => {
          console.error('[11Labs] conversation error', err);
          setError(String(err));
          setStatus('error');
        },
      }) as unknown as ElevenConversation;

      conversationRef.current = conversation;
      setStatus('listening');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setStatus('error');
    }
  }, []);

  const pauseSession = useCallback(async () => {
    try {
      if (conversationRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (conversationRef.current as any).setMicMuted === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (conversationRef.current as any).setMicMuted(true);
        } else if (typeof (conversationRef.current as any).setMuted === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (conversationRef.current as any).setMuted(true);
        }
      }
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to pause session');
      setStatus('error');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => undefined);
        conversationRef.current = null;
      }
    };
  }, []);

  // -----------------------------------------------------------------------
  //  UI helpers
  // -----------------------------------------------------------------------

  const getButtonState = () => {
    switch (status) {
      case 'idle':
        return { text: 'Start Talking', color: 'blue', icon: <IconMicrophone size={20} /> };
      case 'listening':
        return { text: 'Stop Listening', color: 'red', icon: <IconMicrophoneOff size={20} /> };
      case 'speaking':
        return { text: 'Speaking...', color: 'green', icon: <IconPlayerPlay size={20} /> };
      case 'error':
        return { text: 'Retry', color: 'orange', icon: <IconAlertCircle size={20} /> };
    }
  };

  const buttonState = getButtonState();
  const isBusy = status === 'speaking';

  const handleButtonClick = () => {
    if (status === 'idle' || status === 'error') {
      startOrResumeSession();
    } else if (status === 'listening') {
      pauseSession();
    }
  };

  // -----------------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------------

  return (
    <PrototypeLayout title="Instant Insight Box">
      <Stack align="center" gap="xl">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" maw={400} w="100%">
            {error}
          </Alert>
        )}

        <Button
          size="xl"
          radius="xl"
          color={buttonState.color}
          onClick={handleButtonClick}
          disabled={isBusy}
          leftSection={isBusy ? <Loader size={20} /> : buttonState.icon}
          style={{ minHeight: '80px', minWidth: '220px', fontSize: '16px', fontWeight: 600 }}
        >
          {buttonState.text}
        </Button>
      </Stack>
    </PrototypeLayout>
  );
} 