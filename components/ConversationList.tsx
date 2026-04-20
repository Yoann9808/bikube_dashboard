'use client';

import { useMemo } from 'react';
import { DashboardConversation } from '@/lib/types';

interface ConversationListProps {
  conversations: DashboardConversation[];
  selectedPhone: string | null;
  onSelectPhone: (phone: string) => void;
  searchQuery: string;
  dateFilter: 'today' | '7days' | 'all';
  escaladesOnly: boolean;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const msgDate = new Date(date);
  const diffMs = now.getTime() - msgDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'à l\'instant';
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  return `il y a ${diffDays} j`;
}

function truncateMessage(message: string): string {
  return message.length > 50 ? message.substring(0, 50) + '...' : message;
}

export default function ConversationList({
  conversations,
  selectedPhone,
  onSelectPhone,
  searchQuery,
  dateFilter,
  escaladesOnly,
}: ConversationListProps) {
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((conv) =>
        conv.phone_number.includes(searchQuery)
      );
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter((conv) => new Date(conv.last_message_at) >= today);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((conv) => new Date(conv.last_message_at) >= sevenDaysAgo);
    }

    // Filter escalades only
    if (escaladesOnly) {
      filtered = filtered.filter((conv) => conv.has_escalade);
    }

    // Sort: escalades first, then by last_message_at desc
    return filtered.sort((a, b) => {
      if (a.has_escalade && !b.has_escalade) return -1;
      if (!a.has_escalade && b.has_escalade) return 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  }, [conversations, searchQuery, dateFilter, escaladesOnly]);

  return (
    <div className="w-80 bg-[var(--bg2)] border-r border-[var(--border)] overflow-y-auto">
      {filteredConversations.map((conv) => (
        <div
          key={conv.phone_number}
          onClick={() => onSelectPhone(conv.phone_number)}
          className={`p-4 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg3)] transition-colors ${
            selectedPhone === conv.phone_number ? 'border-l-3 border-l-[var(--accent)] bg-[var(--accent-light)]' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-[var(--text)] text-sm">{conv.phone_number}</span>
            <span className="text-xs text-[var(--text3)]">{formatTimeAgo(conv.last_message_at)}</span>
          </div>
          <p className="text-sm text-[var(--text2)] mb-2 truncate">{truncateMessage(conv.last_message)}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text3)]">{conv.nb_messages} messages</span>
            {conv.has_escalade && (
              <span className="px-2 py-1 bg-[var(--escalade-bg)] text-[var(--escalade)] text-xs uppercase rounded-[var(--radius-sm)] font-medium">
                Escalade
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}