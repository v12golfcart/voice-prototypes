'use client';

import { SimpleGrid } from '@mantine/core';
import { PrototypeCard } from '../shared/PrototypeCard';

const prototypes = [
  {
    id: 'instant-insight',
    title: 'Instant Insight Box',
    description: 'Capture usability breakdowns at the moment of friction for SaaS products',
    href: '/instant-insight'
  },
  {
    id: 'smart-concierge',
    title: 'Smart Follow-Up Concierge',
    description: 'Post-purchase feedback and support for CPG and e-commerce brands',
    href: '/smart-concierge'
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