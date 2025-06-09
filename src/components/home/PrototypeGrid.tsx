'use client';

import { SimpleGrid } from '@mantine/core';
import { PrototypeCard } from '../shared/PrototypeCard';

const prototypes = [
  {
    id: 'uxr-prototype',
    title: 'UXR Prototype',
    description: 'Capture usability breakdowns at the moment of friction for SaaS products',
    href: '/uxr-prototype'
  },
  {
    id: 'expert-pulse',
    title: 'On-Demand Expert Pulse',
    description: 'Automated expert networks for investors and product builders',
    href: '/expert-pulse'
  },
  {
    id: 'sandbox',
    title: 'Sandbox',
    description: 'Experimental space for testing voice interactions and new features',
    href: '/sandbox'
  }
];

export function PrototypeGrid() {
  return (
    <SimpleGrid
      cols={{ base: 1, xs: 1, sm: 2 }}
      spacing={{ base: 'md', sm: 'lg' }}
      verticalSpacing={{ base: 'md', sm: 'lg' }}
    >
      {prototypes.map((prototype) => (
        <PrototypeCard
          key={prototype.id}
          title={prototype.title}
          description={prototype.description}
          href={prototype.href}
        />
      ))}
    </SimpleGrid>
  );
} 