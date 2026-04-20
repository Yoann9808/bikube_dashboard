'use client';

import { Conversation } from '@/lib/types';

interface ConversationThreadProps {
  messages: Conversation[];
  selectedPhone: string | null;
}

function formatTimestamp(date: string): string {
  const d = new Date(date);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationThread({ messages, selectedPhone }: ConversationThreadProps) {
  if (!selectedPhone) {
    return (
      <div className="flex-1 bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-serif italic text-[var(--text3)] mb-2">Sélectionnez une conversation</p>
          <p className="text-sm text-[var(--text2)]">Choisissez un numéro dans la liste pour voir les messages</p>
        </div>
      </div>
    );
  }

  const hasEscalade = messages.some(msg => msg.is_escalade);

  return (
    <div className="flex-1 bg-[var(--bg)] flex flex-col">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-serif text-[var(--text)]">{selectedPhone}</h2>
        <p className="text-sm text-[var(--text2)]">{messages.length} messages</p>
      </div>
      {hasEscalade && (
        <div className="px-6 py-2 bg-[var(--escalade-bg)] border-b border-[var(--escalade)]">
          <p className="text-sm text-[var(--escalade)] font-medium">Conversation avec escalade</p>
        </div>
      )}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-[12px] ${
                msg.role === 'user'
                  ? 'bg-[var(--bg2)] text-[var(--text)] rounded-br-[2px]'
                  : 'bg-[var(--accent)] text-white rounded-bl-[2px]'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className="text-xs opacity-70 mt-2">{formatTimestamp(msg.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}