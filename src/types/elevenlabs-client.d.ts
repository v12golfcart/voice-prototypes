declare module '@elevenlabs/client' {
  export function Conversation(...args: never[]): never; // Placeholder – we use dynamic import typings.
  export const Conversation: {
    startSession: (options: Record<string, unknown>) => Promise<unknown>;
  };
} 