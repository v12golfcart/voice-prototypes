'use client';

import { SimpleGrid } from '@mantine/core';
import { PrototypeCard } from '../shared/PrototypeCard';

const prototypes = [
  {
    id: 'instant-insight',
    title: 'Instant Insight Box',
    description: 'Capture usability breakdowns at the moment of friction for SaaS products',
    thumbnail: '/images/instant-insight.jpg',
    href: '/instant-insight'
  },
  {
    id: 'smart-concierge',
    title: 'Smart Follow-Up Concierge',
    description: 'Post-purchase feedback and support for CPG and e-commerce brands',
    thumbnail: '/images/smart-concierge.jpg',
    href: '/smart-concierge'
  },
  {
    id: 'expert-pulse',
    title: 'On-Demand Expert Pulse',
    description: 'Automated expert networks for investors and product builders',
    thumbnail: '/images/expert-pulse.jpg',
    href: '/expert-pulse'
  },
  {
    id: 'sandbox',
    title: 'Sandbox',
    description: 'Experimental space for testing voice interactions and new features',
    thumbnail: '/images/sandbox.jpg',
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
          thumbnail={prototype.thumbnail}
          href={prototype.href}
        />
      ))}
    </SimpleGrid>
  );
} 