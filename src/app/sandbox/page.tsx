'use client';

import { Stack } from '@mantine/core';
import { PrototypeLayout } from '@/components/shared/PrototypeLayout';
import { VoiceTestBlock } from '@/components/shared/VoiceTestBlock';

export default function SandboxPage() {
  return (
    <PrototypeLayout title="Sandbox">
      <Stack gap="xl">
        {/* 11Labs Voice Test */}
        <VoiceTestBlock
          title="11Labs Voice Interface Test"
          subtitle="11Labs will listen to what you say and play it back to you."
          prototype="sandbox"
        />
        
        {/* Future provider blocks would go here */}
        {/* 
        <VoiceTestBlock
          title="VAPI Voice Interface Test"
          subtitle="VAPI alternative implementation"
          prototype="sandbox-vapi"
        />
        */}
      </Stack>
    </PrototypeLayout>
  );
} 