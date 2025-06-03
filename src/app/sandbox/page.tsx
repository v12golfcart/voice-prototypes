'use client';

import { Text } from '@mantine/core';
import { PrototypeLayout } from '@/components/shared/PrototypeLayout';

export default function SandboxPage() {
  return (
    <PrototypeLayout title="Sandbox">
      <Text size="lg" ta="center" c="dimmed">
        Experimental space for testing...
      </Text>
    </PrototypeLayout>
  );
} 