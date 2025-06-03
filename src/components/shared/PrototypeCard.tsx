'use client';

import { Card, Image, Text, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';

interface PrototypeCardProps {
  title: string;
  description: string;
  thumbnail: string;
  href: string;
}

export function PrototypeCard({ title, description, thumbnail, href }: PrototypeCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', height: '100%' }}
      onClick={handleClick}
    >
      <Card.Section>
        <Image
          src={thumbnail}
          height={120}
          alt={title}
          fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNDQgOTBIMTc2VjEyMkgxNDRWOTBaIiBmaWxsPSIjRERERERcIi8+Cjwvc3ZnPgo="
        />
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Text fw={600} size="lg" lineClamp={1}>
          {title}
        </Text>
        
        <Text size="sm" c="dimmed" lineClamp={2}>
          {description}
        </Text>
      </Stack>
    </Card>
  );
} 