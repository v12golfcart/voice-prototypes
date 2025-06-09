'use client';

// This file is copied from the former Instant Insight route and serves the new UXR Prototype path.
// ... existing code duplicated below ...

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Stack, Alert, Loader, Card, Text, ActionIcon, Center, Textarea, TextInput } from '@mantine/core';
import { IconPhone, IconPhoneOff, IconMicrophone, IconAlertCircle } from '@tabler/icons-react';
import { PrototypeLayout } from '@/components/shared/PrototypeLayout';
import { showNotification } from '@mantine/notifications';

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_UXR_AGENT_ID || '';

const DEFAULT_SCENARIO =
  'You are a researcher for Discord and have been tasked to learn what types of problems people are facing with voice. You are about to connect with a participant who has opted into sharing details after reporting they had a bad experience after leaving a voice call.';
const DEFAULT_FIRST_MSG = 'Hello! Can you tell me about the issue you faced?';

// You are a researcher for Discord and have been tasked to learn why people are asking for certain features. You are about to talk to a participant who submitted a feature idea
// Hello! Can you tell me about your idea?

type Status = 'idle' | 'connecting' | 'active' | 'speaking' | 'error';

interface ElevenConversation {
  endSession: () => Promise<void>;
  setMicMuted?: (mute: boolean) => Promise<void> | void;
  setMuted?: (mute: boolean) => Promise<void> | void;
}

async function setConversationMuted(conv: ElevenConversation, mute: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = conv;
  if (typeof c.setMicMuted === 'function') {
    await c.setMicMuted(mute);
  } else if (typeof c.setMuted === 'function') {
    await c.setMuted(mute);
  }
}

export default function UxrPrototypePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<ElevenConversation | null>(null);
  const [isPTTPressed, setIsPTTPressed] = useState(false);
  const [scenario, setScenario] = useState<string>(DEFAULT_SCENARIO);
  const [firstMsg, setFirstMsg] = useState<string>(DEFAULT_FIRST_MSG);
  const [savedScenario, setSavedScenario] = useState<string>(DEFAULT_SCENARIO);
  const [savedFirst, setSavedFirst] = useState<string>(DEFAULT_FIRST_MSG);
  const [log, setLog] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any | null>(null);
  const [isSummarising, setIsSummarising] = useState(false);
  const [progress, setProgress] = useState<{ callDone: boolean; transcript: boolean; analyzed: boolean }>({
    callDone: false,
    transcript: false,
    analyzed: false,
  });
  const [agentUtterance, setAgentUtterance] = useState<string>('');

  const resetProgress = () =>
    setProgress({
      callDone: false,
      transcript: false,
      analyzed: false,
    });

  const startCall = useCallback(async () => {
    setError(null);
    resetProgress();
    setSummary(null);
    setIsSummarising(false);
    setAgentUtterance('');
    if (!AGENT_ID) {
      setError('Missing ElevenLabs agent id');
      setStatus('error');
      return;
    }

    try {
      // Debug: call initialization
      // eslint-disable-next-line no-console
      console.log('[UxrPrototype] Starting call');

      setStatus('connecting');
      const { Conversation } = await import('@elevenlabs/client');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation = await (Conversation as any).startSession({
        agentId: AGENT_ID,
        dynamicVariables: {
          scenario,
          first_message: firstMsg,
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          setStatus(mode.mode === 'speaking' ? 'speaking' : 'active');
        },
        onError: (err: unknown) => {
          console.error('[11Labs] conversation error', err);
          setError(String(err));
          setStatus('error');
        },
        onMessage: (m: { message: string; source: 'user' | 'ai' }) => {
          // Debug: onMessage event
          // eslint-disable-next-line no-console
          console.log('[UxrPrototype] onMessage', m);
          setLog((prev) => [...prev, { role: m.source === 'user' ? 'user' : 'assistant', text: m.message }]);
          if (m.source === 'ai') {
            setAgentUtterance(m.message);
          }
        },
      }) as unknown as ElevenConversation;

      conversationRef.current = conversation;
      await setConversationMuted(conversation, true);
      setStatus('active');

      // Debug: session started
      // eslint-disable-next-line no-console
      console.log('[UxrPrototype] Call session started', conversation);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start call');
      setStatus('error');
    }
  }, [AGENT_ID, scenario, firstMsg]);

  const endCall = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
      setStatus('idle');
      setProgress((p) => ({ ...p, callDone: true }));
      setAgentUtterance('');

      // Trigger summary generation
      if (log.length > 0) {
        // Debug: log transcript before sending to summary endpoint
        // eslint-disable-next-line no-console
        console.log('[UxrPrototype] Transcript to summarise:', log);
        setProgress((p) => ({ ...p, transcript: true }));
        setIsSummarising(true);
        try {
          const res = await fetch('/api/summarise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: log }),
          });
          const data = await res.json();
          if (res.ok) {
            setSummary(data.summary);
            setProgress({ callDone: true, transcript: true, analyzed: true });
          } else {
            showNotification({ title: 'Summary failed', message: data.error || 'Error', color: 'red' });
          }
        } catch (err) {
          showNotification({ title: 'Summary failed', message: String(err), color: 'red' });
        } finally {
          setIsSummarising(false);
          setLog([]);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to end call');
      setStatus('error');
    }
  }, [log]);

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

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => undefined);
      }
    };
  }, []);

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

  // Save handler
  const handleSave = async () => {
    // No change safeguard
    if (scenario === savedScenario && firstMsg === savedFirst) return;

    // End active call
    if (status === 'active' || status === 'speaking' || status === 'connecting') {
      await endCall();
    }

    // Persist new defaults
    setSavedScenario(scenario);
    setSavedFirst(firstMsg);

    showNotification({
      title: 'Context updated',
      message: 'New scenario and first message will be used for the next call.',
      color: 'green',
    });
  };

  const hasChanges = scenario !== savedScenario || firstMsg !== savedFirst;

  return (
    <PrototypeLayout title="UXR Prototype">
      <Center>
        <Card shadow="sm" radius="lg" p="lg" style={{ width: 320, textAlign: 'center' }}>
          <Text fw={600} mb="sm">
            {statusLabel[status]}
          </Text>

          {/* Equalizer bars */}
          <Center style={{ height: 120 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
              {[...Array(5)].map((_, i) => {
                const duration = 0.8 + i * 0.15;
                const delay = i * 0.05;
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
          <style jsx>{`
            @keyframes eq-bars {
              0% {
                transform: scaleY(0.2);
                background: #4dabf7;
              }
              50% {
                transform: scaleY(1);
                background: #4dabf7;
              }
              100% {
                transform: scaleY(0.2);
                background: #4dabf7;
              }
            }
          `}</style>

          {/* Agent utterance placeholder below waveforms (visible only during call) */}
          {inCall && (
          <div
            style={{
              height: 80,
              display: 'block',
              overflowY: 'auto',
              overflowX: 'hidden',
              marginTop: 4,
              marginBottom: 8,
              border: '1px dashed #ccc',
              padding: 8,
              boxSizing: 'border-box',
            }}
          >
            {agentUtterance && (
              <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>
                {agentUtterance}
              </Text>
            )}
          </div>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mt="md">
              {error}
            </Alert>
          )}

          <Stack gap="md" mt="md">
            {showStartButton && (
              <Button leftSection={<IconPhone size={16} />} color="blue" onClick={startCall} fullWidth mt="md">
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

      {/* Editable variables */}
      <Center mt="xl">
        <Card shadow="sm" radius="lg" p="lg" style={{ width: 320 }}>
          <Stack gap="md">
            <Text fw={600}>Context</Text>
            <Textarea
              label="Scenario"
              autosize
              minRows={3}
              value={scenario}
              onChange={(e) => setScenario(e.currentTarget.value)}
            />
            <TextInput
              label="First message"
              value={firstMsg}
              onChange={(e) => setFirstMsg(e.currentTarget.value)}
            />
            <Button onClick={handleSave} fullWidth color={hasChanges ? 'blue' : 'gray'} disabled={!hasChanges}>
              Save
            </Button>
          </Stack>
        </Card>
      </Center>

      {/* Insights Summary */}
      <Center mt="xl">
        <Card shadow="sm" radius="lg" p="lg" style={{ width: 320 }}>
          {/* Fresh page / no call yet */}
          {status === 'idle' && !progress.callDone && !isSummarising && !summary && (
            <Stack align="center" gap="sm">
              <Text size="sm" c="dimmed">
                Insights will load at the end of the call.
              </Text>
            </Stack>
          )}

          {/* Loader when generating summary */}
          {isSummarising && (
            <Stack align="center" gap="sm">
              <Loader />
              <Text size="sm">Generating summary…</Text>
            </Stack>
          )}

          {/* Checklist & summary (shown during/after calls) */}
          {(status !== 'idle' || progress.callDone || isSummarising || summary) && (
            <Stack gap="xs" mt={isSummarising ? 'md' : 0}>
              <Text fw={600}>Insights Summary</Text>
              <Text size="sm" c={progress.callDone ? undefined : 'dimmed'}>
                {progress.callDone ? '✅' : '▢'} Call done
              </Text>
              <Text size="sm" c={progress.transcript ? undefined : 'dimmed'}>
                {progress.transcript ? '✅' : '▢'} Transcript received
              </Text>
              <Text size="sm" c={progress.analyzed ? undefined : 'dimmed'}>
                {progress.analyzed ? '✅' : '▢'} Analyzed
              </Text>

              {summary && (
                <>
                  <Text size="sm">
                    <b>Themes:</b> {Array.isArray(summary.themes) ? summary.themes.join(', ') : '—'}
                  </Text>
                  <Text size="sm">
                    <b>Summary:</b> {summary.concise_summary ?? '—'}
                  </Text>
                  <Text size="sm" fs="italic">
                    &ldquo;{summary.quote ?? ''}&rdquo;
                  </Text>
                </>
              )}
            </Stack>
          )}
        </Card>
      </Center>
    </PrototypeLayout>
  );
} 