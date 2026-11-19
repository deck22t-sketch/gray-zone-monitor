'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Globe, Activity, Scale, Eye } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: ShieldAlert },
  { href: '/geopolitics', label: 'Geopolitics', icon: Globe },
  { href: '/incidents', label: 'Forensics', icon: Activity },
  { href: '/contagion', label: 'Contagion', icon: Scale },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Primary Navigation"
      className="md:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-[#070A10]/[0.98] backdrop-blur-md border-t border-white/[0.12] pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-stretch px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 transition border-t-2 ${
                active
                  ? 'border-[#38BDF8] text-[#38BDF8] bg-white/[0.03]'
                  : 'border-transparent text-gray-400 hover:text-gray-200 active:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#38BDF8]' : 'text-gray-400'}`} />
              <span className="font-mono-tactical text-[10px] font-medium tracking-tight leading-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
