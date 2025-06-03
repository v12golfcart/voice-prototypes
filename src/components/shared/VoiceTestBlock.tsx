'use client';

import { Stack, Text, Title, Alert, Group, Box } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { VoiceButton } from '../voice/VoiceButton';

interface VoiceTestBlockProps {
  title: string;
  subtitle: string;
  prototype: string;
  error?: string | null;
}

export function VoiceTestBlock({ title, subtitle, prototype, error }: VoiceTestBlockProps) {
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
          <VoiceButton prototype={prototype} />
        </Box>
        
        {/* Desktop button (right-aligned) */}
        <Box 
          style={{ flexShrink: 0 }}
          visibleFrom="sm"
        >
          <VoiceButton prototype={prototype} />
        </Box>
      </Group>
    </Stack>
  );
} 