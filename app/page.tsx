'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Conversation, DashboardConversation } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import FilterBar from '@/components/FilterBar';
import ConversationList from '@/components/ConversationList';
import ConversationThread from '@/components/ConversationThread';
import RealtimeIndicator from '@/components/RealtimeIndicator';

export default function Conversations() {
  // Check environment variables first
  const hasValidConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy.supabase.co';

  if (!hasValidConfig) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-[var(--accent)] mb-4">Bikube</h1>
          <p className="text-[var(--text2)]">Veuillez configurer vos variables d&apos;environnement Supabase dans .env.local</p>
        </div>
      </div>
    );
  }

  return <ConversationsContent />;
}

function ConversationsContent() {
  const [conversations, setConversations] = useState<DashboardConversation[]>([]);
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'all'>('all');
  const [escaladesOnly, setEscaladesOnly] = useState(false);

  // Fetch dashboard conversations
  const fetchConversations = async () => {
    const { data, error } = await getSupabaseClient()
      .from('dashboard_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      setConversations(data || []);
    }
  };

  // Fetch messages for selected phone
  const fetchMessages = async (phone: string) => {
    const { data, error } = await getSupabaseClient()
      .from('conversations')
      .select('*')
      .eq('phone_number', phone)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchConversations();

      // Check for selected phone from localStorage (from dashboard)
      const storedPhone = localStorage.getItem('selectedPhone');
      if (storedPhone) {
        setSelectedPhone(storedPhone);
        await fetchMessages(storedPhone);
        localStorage.removeItem('selectedPhone');
      }
    };

    loadData();

    // Subscribe to new messages
    const channel = getSupabaseClient()
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        async (payload) => {
          console.log('Change received!', payload);
          await fetchConversations(); // Refetch list on any change
          if (selectedPhone && (payload.new as Conversation)?.phone_number === selectedPhone) {
            await fetchMessages(selectedPhone); // Refetch messages if for selected phone
          }
        }
      )
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, [selectedPhone]);

  const handleSelectPhone = (phone: string) => {
    setSelectedPhone(phone);
    fetchMessages(phone);
  };

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-[var(--border)] px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif text-[var(--text)]">Conversations</h1>
            <p className="text-xs font-sans uppercase tracking-wider text-[var(--text3)]">Supervision IA</p>
          </div>
          <RealtimeIndicator />
        </header>
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          escaladesOnly={escaladesOnly}
          onEscaladesOnlyChange={setEscaladesOnly}
        />
        <div className="flex flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedPhone={selectedPhone}
            onSelectPhone={handleSelectPhone}
            searchQuery={searchQuery}
            dateFilter={dateFilter}
            escaladesOnly={escaladesOnly}
          />
          <ConversationThread messages={messages} selectedPhone={selectedPhone} />
        </div>
      </div>
    </div>
  );
}
