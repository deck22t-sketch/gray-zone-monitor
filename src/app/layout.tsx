import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PortalProvider } from '@/context/PortalContext';
import { VaultGate } from '@/components/shell/VaultGate';
import { TopNav } from '@/components/shell/TopNav';
import { MobileBottomNav } from '@/components/shell/MobileBottomNav';
import { PortalFooter } from '@/components/shell/PortalFooter';
import { SourceDrawer } from '@/components/shell/SourceDrawer';
import { ChangelogDrawer } from '@/components/shell/ChangelogDrawer';
import { CommandSearchModal } from '@/components/shell/CommandSearchModal';
import { BriefingExportModal } from '@/components/shell/BriefingExportModal';
import { PwaRegistrar } from '@/components/shell/PwaRegistrar';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

export const viewport: Viewport = {
  themeColor: '#06080C',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Gray-Zone & Infrastructure Monitor — Private Briefing',
    template: '%s | Gray-Zone Monitor',
  },
  description:
    'Private executive risk synthesis & public infrastructure telemetry briefing. Shared access passphrase required.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/icon.svg`,
    apple: `${basePath}/icon.svg`,
  },
  openGraph: {
    title: 'Gray-Zone & Infrastructure Monitor',
    description: 'Private executive risk briefing. Enter shared passphrase to unlock.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={
        {
          '--font-inter': "'Inter'",
          '--font-jetbrains-mono': "'JetBrains Mono'",
        } as React.CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#06080C] text-gray-200 antialiased selection:bg-[#38BDF8]/25 selection:text-white">
        <PwaRegistrar />
        <PortalProvider>
          <VaultGate>
            <div className="min-h-screen flex flex-col">
              <TopNav />
              <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 sm:pb-12">
                {children}
              </main>
              <PortalFooter />
              <MobileBottomNav />
            </div>
            <SourceDrawer />
            <ChangelogDrawer />
            <CommandSearchModal />
            <BriefingExportModal />
          </VaultGate>
        </PortalProvider>
      </body>
    </html>
  );
}
