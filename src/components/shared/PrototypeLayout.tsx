'use client';

import { Container } from '@mantine/core';
import { PrototypeHeader } from './PrototypeHeader';

interface PrototypeLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function PrototypeLayout({ title, children }: PrototypeLayoutProps) {
  return (
    <Container size="md" px="md" py="lg">
      <PrototypeHeader title={title} />
      {children}
    </Container>
  );
} 