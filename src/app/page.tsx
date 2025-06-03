"use client";

import { Container, Title, Text, Stack } from '@mantine/core';
import { PrototypeGrid } from '@/components/home/PrototypeGrid';

export default function Home() {
  return (
    <Container size="md" px="md" py="xl">
      <Stack gap="xl">
        <Stack gap="md" ta="center">
          <Title order={1} size="h2">
            UXR Prototype
          </Title>
          <Text size="lg" c="dimmed">
            AI-Powered Interview Agents
          </Text>
        </Stack>
        
        <PrototypeGrid />
      </Stack>
    </Container>
  );
}
