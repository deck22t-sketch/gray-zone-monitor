import type { Metadata } from 'next';
import { OverviewView } from '@/components/views/OverviewView';

export const metadata: Metadata = {
  title: 'Command Overview — Executive Risk Matrix & 120-Day Cliffs',
  description:
    'Executive Summary, 8-Vector Risk Matrix (Immediate, 10–54 Days, 2027–2030), live 120-day supply-chain & cryptographic countdown cliffs, and 8/8 public OSINT feed telemetry.',
};

export default function HomePage() {
  return <OverviewView />;
}
