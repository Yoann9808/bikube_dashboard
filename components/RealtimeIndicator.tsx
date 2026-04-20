'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function RealtimeIndicator() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const channel = getSupabaseClient().channel('realtime-indicator');

    channel
      .on('system', { event: 'CHANNEL_JOIN' }, () => setIsOnline(true))
      .on('system', { event: 'CHANNEL_ERROR' }, () => setIsOnline(false))
      .on('system', { event: 'CHANNEL_LEAVE' }, () => setIsOnline(false))
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-sans">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-[var(--accent)]' : 'bg-[var(--escalade)]'
        }`}
      />
      <span className="text-[var(--text2)]">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
    </div>
  );
}