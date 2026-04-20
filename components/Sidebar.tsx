'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, MessageSquare } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { href: '/', icon: MessageSquare, label: 'Conversations' },
  ];

  return (
    <div className="w-28 bg-white border-r border-[var(--border)] flex flex-col">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`p-4 flex flex-col items-center justify-center hover:bg-[var(--bg3)] transition-colors relative ${
              isActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]'
            }`}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
            )}
            <item.icon size={24} />
            <span className="text-xs mt-2 font-medium text-center leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}