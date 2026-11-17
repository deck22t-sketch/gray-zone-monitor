import type { Metadata } from 'next';
import { GeopoliticsView } from '@/components/views/GeopoliticsView';

export const metadata: Metadata = {
  title: 'Historical & Geopolitical Arc — Russia, China, Iran & Critical Minerals',
  description:
    'Bolshevik Monopoly/Finance Capitalism vs. Putin’s Petrine revanchism, 2026–2030 Russia–China escalation windows, Operation Epic Fury attrition, and Chinese mineral/API chokepoints.',
};

export default function GeopoliticsPage() {
  return <GeopoliticsView />;
}
