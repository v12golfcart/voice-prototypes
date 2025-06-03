'use client';

import { Group, Title, Box } from '@mantine/core';
import { useRouter } from 'next/navigation';

interface PrototypeHeaderProps {
  title: string;
}

export function PrototypeHeader({ title }: PrototypeHeaderProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/');
  };

  return (
    <Box
      style={{ 
        cursor: 'pointer',
        padding: '16px 0',
        borderBottom: '1px solid #e9ecef',
        marginBottom: '24px'
      }}
      onClick={handleClick}
    >
      <Group justify="space-between" align="center">
        <Title order={2} size="h3">
          {title}
        </Title>
        <Box 
          style={{ 
            fontSize: '12px', 
            color: '#868e96',
            fontWeight: 500 
          }}
        >
          ← Home
        </Box>
      </Group>
    </Box>
  );
} 