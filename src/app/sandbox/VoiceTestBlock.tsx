'use client';

import { Stack, Text, Title, Alert, Group, Box, Table } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { useState, useCallback, useRef } from 'react';

interface VoiceTestBlockProps {
  title: string;
  subtitle: string;
  prototype: string;
  error?: string | null;
  notes?: React.ReactNode;
}

interface ActivityItem {
  timestamp: Date;
  message: string;
}

export function VoiceTestBlock({ title, subtitle, prototype, error, notes }: VoiceTestBlockProps) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const userStopAtRef = useRef<Date | null>(null);
  const playbackStartAtRef = useRef<Date | null>(null);
  const [totalWaitMs, setTotalWaitMs] = useState<number | null>(null);

  const handleActivity = useCallback((message: string) => {
    const now = new Date();

    if (message === 'user clicks button to start talking') {
      // Reset everything for a fresh session
      setActivity([{ timestamp: now, message }]);
      userStopAtRef.current = null;
      playbackStartAtRef.current = null;
      setTotalWaitMs(null);
      return;
    }

    // Append to log
    setActivity(prev => [...prev, { timestamp: now, message }]);

    if (message === 'user clicks button to stop talking' || message === 'user stops speaking') {
      userStopAtRef.current = now;
    }

    if (message === 'TTS -- speech playback started' || message === 'assistant starts speaking') {
      playbackStartAtRef.current = now;
      if (userStopAtRef.current) {
        setTotalWaitMs(now.getTime() - userStopAtRef.current.getTime());
      }
    }
  }, []);

  return (
    <Stack gap="lg" align="stretch">
      {/* Error Section - appears above everything */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          variant="light"
        >
          {error}
        </Alert>
      )}

      {/* Main 2-column layout for desktop, stacked for mobile */}
      <Group align="flex-start" justify="space-between" wrap="wrap" gap="xl">
        {/* Left Column - Content */}
        <Box style={{ flex: 1, minWidth: '300px' }}>
          <Stack gap="xs">
            <Title order={2} size="h3" fw={600}>
              {title}
            </Title>
            <Text size="md" c="dimmed">
              {subtitle}
            </Text>

            {notes && (
              <Box mt="xs">
                {notes}
              </Box>
            )}
          </Stack>
        </Box>

        {/* Right Column - Voice Button (centered on mobile) */}
        <Box 
          style={{ 
            flexShrink: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
          hiddenFrom="sm"
        >
          <VoiceButton prototype={prototype} onActivity={handleActivity} />
        </Box>
        
        {/* Desktop button (right-aligned) */}
        <Box 
          style={{ flexShrink: 0 }}
          visibleFrom="sm"
        >
          <VoiceButton prototype={prototype} onActivity={handleActivity} />
        </Box>
      </Group>

      {/* Activity Table */}
      {activity.length > 0 && (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '180px' }}>Timestamp</Table.Th>
              <Table.Th>Audit Log</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {activity.map((item, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  {item.timestamp.toLocaleString(undefined, {
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    fractionalSecondDigits: 2,
                  })}
                </Table.Td>
                <Table.Td>{item.message}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Total wait time */}
      {totalWaitMs !== null && (
        <Text size="sm" fw={600}>
          Total time waiting for a response: {(totalWaitMs / 1000).toFixed(2)} seconds
        </Text>
      )}
    </Stack>
  );
} 