'use client';

import { Stack, List } from '@mantine/core';
import { PrototypeLayout } from '@/components/shared/PrototypeLayout';
import { VoiceTestBlock } from './VoiceTestBlock';

export default function SandboxPage() {
  return (
    <PrototypeLayout title="Sandbox">
      <Stack gap="xl">
        {/* 11Labs Voice Test */}
        <VoiceTestBlock
          title="ElevenLabs REST STT / TTS Flow"
          subtitle="Client records → server proxy → REST calls for Speech-to-Text and Text-to-Speech"
          prototype="sandbox"
          notes={
            <List size="sm" spacing="xs" withPadding>
              <List.Item>It&apos;s simple and you have full control over processing</List.Item>
              <List.Item>but the latency is bad – okay for submission UXs but not back-and-forth UX</List.Item>
            </List>
          }
        />
        
        {/* 11Labs Conversational AI SDK Test */}
        <VoiceTestBlock
          title="ElevenLabs Conversational AI SDK (Real-time Agent)"
          subtitle="Streams microphone audio to an Agent via SDK WebSocket. ElevenLabs handles STT, LLM response, TTS, and turn-taking."
          prototype="sandbox-sdk"
          notes={
            <List size="sm" spacing="xs" withPadding>
              <List.Item>Much more responsive, lower latency back and forth</List.Item>
              <List.Item>I have less control over individual turns in back and forth; control generally abstracted away</List.Item>
            </List>
          }
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