'use client';

import { Button, Stack, Text, Alert, Loader } from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff, IconPlayerPlay, IconAlertCircle } from '@tabler/icons-react';
import { useVoice } from '../hooks/useVoice';

interface VoiceButtonProps {
  prototype: string;
  disabled?: boolean;
}

export function VoiceButton({ prototype, disabled = false }: VoiceButtonProps) {
  const {
    isRecording,
    isProcessing,
    isPlaying,
    currentSession,
    error,
    startRecording,
    stopRecording,
    initializeProvider,
  } = useVoice(prototype);

  const handleClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const getButtonState = () => {
    if (isProcessing) return { text: 'Processing...', color: 'orange', icon: <Loader size={20} /> };
    if (isPlaying) return { text: 'Playing Response', color: 'green', icon: <IconPlayerPlay size={20} /> };
    if (isRecording) return { text: 'Recording... (Tap to Stop)', color: 'red', icon: <IconMicrophoneOff size={20} /> };
    return { text: 'Press & Hold to Talk', color: 'blue', icon: <IconMicrophone size={20} /> };
  };

  const buttonState = getButtonState();
  const isLoading = isProcessing || isPlaying;

  return (
    <Stack gap="md" align="center">
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          variant="light"
          style={{ width: '100%' }}
        >
          {error}
          <Button 
            size="xs" 
            variant="subtle" 
            color="red" 
            mt="xs"
            onClick={initializeProvider}
          >
            Retry
          </Button>
        </Alert>
      )}

      <Button
        size="xl"
        radius="xl"
        color={buttonState.color}
        variant={isRecording ? 'filled' : 'light'}
        onClick={handleClick}
        disabled={disabled || isLoading}
        loading={isProcessing}
        leftSection={!isProcessing ? buttonState.icon : undefined}
        style={{
          minHeight: '80px',
          minWidth: '200px',
          fontSize: '16px',
          fontWeight: 600,
        }}
      >
        {buttonState.text}
      </Button>

      {currentSession && currentSession.messages.length > 0 && (
        <Stack gap="xs" align="center">
          <Text size="sm" c="dimmed">
            Messages in this session: {currentSession.messages.length}
          </Text>
          <Text size="xs" c="dimmed">
            Started: {currentSession.startedAt.toLocaleTimeString()}
          </Text>
        </Stack>
      )}

    </Stack>
  );
} 