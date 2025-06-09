'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Stack, Alert, Loader, Card, Text, ActionIcon, Center } from '@mantine/core';
import { IconPhone, IconPhoneOff, IconMicrophone, IconAlertCircle } from '@tabler/icons-react';
import { PrototypeLayout } from '@/components/shared/PrototypeLayout';

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_UXR_AGENT_ID || '';

const SCENARIO =
  'You are a researcher for Discord and have been tasked to learn what types of problems people are facing with voice. You are about to connect with a participant who has opted into sharing details after reporting they had a bad experience after leaving a voice call.';
const FIRST_MESSAGE = 'Hello! Can you tell me about the issue you faced?';

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

type Status = 'idle' | 'connecting' | 'active' | 'speaking' | 'error';

interface ElevenConversation {
  endSession: () => Promise<void>;
  setMicMuted?: (mute: boolean) => Promise<void> | void;
  setMuted?: (mute: boolean) => Promise<void> | void;
}

// Helper to mute/unmute with backwards compatibility
async function setConversationMuted(conv: ElevenConversation, mute: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = conv;
  if (typeof c.setMicMuted === 'function') {
    await c.setMicMuted(mute);
  } else if (typeof c.setMuted === 'function') {
    await c.setMuted(mute);
  }
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

export default function InstantInsightPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<ElevenConversation | null>(null);
  const [isPTTPressed, setIsPTTPressed] = useState(false);

  // -------------------------------------------------------
  //  Start call
  // -------------------------------------------------------
  const startCall = useCallback(async () => {
    setError(null);
    if (!AGENT_ID) {
      setError('Missing ElevenLabs agent id');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      const { Conversation } = await import('@elevenlabs/client');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation = await (Conversation as any).startSession({
        agentId: AGENT_ID,
        dynamicVariables: {
          scenario: SCENARIO,
          first_message: FIRST_MESSAGE,
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          setStatus(mode.mode === 'speaking' ? 'speaking' : 'active');
        },
        onError: (err: unknown) => {
          console.error('[11Labs] conversation error', err);
          setError(String(err));
          setStatus('error');
        },
      }) as unknown as ElevenConversation;

      conversationRef.current = conversation;
      // Mute mic until PTT pressed
      await setConversationMuted(conversation, true);
      setStatus('active');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start call');
      setStatus('error');
    }
  }, []);

  // -------------------------------------------------------
  //  End call
  // -------------------------------------------------------
  const endCall = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to end call');
      setStatus('error');
    }
  }, []);

  // -------------------------------------------------------
  //  Push-to-talk handlers
  // -------------------------------------------------------
  const handlePTTDown = () => {
    if (conversationRef.current) {
      setConversationMuted(conversationRef.current, false).catch(() => undefined);
    }
    setIsPTTPressed(true);
  };

  const handlePTTUp = () => {
    if (conversationRef.current) {
      setConversationMuted(conversationRef.current, true).catch(() => undefined);
    }
    setIsPTTPressed(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => undefined);
      }
    };
  }, []);

  // -------------------------------------------------------
  //  UI helpers
  // -------------------------------------------------------
  const statusLabel: Record<Status, string> = {
    idle: 'Ready',
    connecting: 'Connecting…',
    active: 'Agent is listening',
    speaking: 'Agent is speaking',
    error: 'Error',
  };

  const showStartButton = status === 'idle' || status === 'error';
  const showConnecting = status === 'connecting';
  const inCall = status === 'active' || status === 'speaking';

  // -------------------------------------------------------
  //  Render
  // -------------------------------------------------------
  return (
    <PrototypeLayout title="Instant Insight Box">
      <Center>
        <Card shadow="sm" radius="lg" p="lg" style={{ width: 320, textAlign: 'center' }}>
          <Text fw={600} mb="sm">
            {statusLabel[status]}
          </Text>

          {/* Equalizer bars */}
          <Center style={{ height: 120 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
              {[...Array(5)].map((_, i) => {
                // Vary duration and delay for less uniform motion
                const duration = 0.8 + i * 0.15; // seconds
                const delay = i * 0.05; // seconds
                return (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 40,
                      background: '#9e9e9e',
                      borderRadius: 4,
                      animation:
                        status === 'speaking'
                          ? `eq-bars ${duration}s ease-in-out ${delay}s infinite alternate`
                          : 'none',
                      transformOrigin: 'bottom',
                    }}
                  />
                );
              })}
            </div>
          </Center>

          {/* Keyframes injected once */}
          <style jsx>{`
            @keyframes eq-bars {
              0% {transform: scaleY(0.2); background: #4dabf7;}
              50% {transform: scaleY(1); background: #4dabf7;}
              100% {transform: scaleY(0.2); background: #4dabf7;}
            }
          `}</style>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mt="md">
              {error}
            </Alert>
          )}

          <Stack gap="md" mt="md">
            {showStartButton && (
              <Button
                leftSection={<IconPhone size={16} />}
                color="blue"
                onClick={startCall}
                fullWidth
                mt="md"
              >
                Start call
              </Button>
            )}

            {showConnecting && (
              <Button leftSection={<Loader size={16} />} color="gray" disabled fullWidth mt="md">
                Connecting…
              </Button>
            )}

            {inCall && (
              <>
                {/* Row with PTT centered and End-call right */}
                <div style={{ position: 'relative', width: '100%', paddingTop: 16, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ActionIcon
                      size={96}
                      radius={96}
                      variant="filled"
                      color={isPTTPressed ? 'green' : 'blue'}
                      onMouseDown={handlePTTDown}
                      onMouseUp={handlePTTUp}
                      onMouseLeave={handlePTTUp}
                      onTouchStart={handlePTTDown}
                      onTouchEnd={handlePTTUp}
                    >
                      <IconMicrophone size={48} />
                    </ActionIcon>
                  </div>

                  {/* End Call button positioned to the right */}
                  <ActionIcon
                    size={48}
                    radius={48}
                    variant="filled"
                    color="red"
                    onClick={endCall}
                    style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <IconPhoneOff size={24} />
                  </ActionIcon>
                </div>

                <Text size="xs" c="dimmed" mt={4}>
                  Push to Talk
                </Text>
              </>
            )}
          </Stack>
        </Card>
      </Center>
    </PrototypeLayout>
  );
} 