'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { MessageSquare, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  getConversationsToday,
  getMessagesToday,
  getEscalationRate,
  getPendingEscalations,
  getHourlyActivity,
  getConversationsYesterday,
  type HourlyActivity,
  type Escalation,
} from '@/lib/dashboard';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  comparison?: string;
  comparisonColor?: string;
}

function MetricCard({ title, value, icon, comparison, comparisonColor }: MetricCardProps) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-6" style={{ boxShadow: 'var(--shadow)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[var(--text2)]">{title}</div>
        <div className="text-[var(--text3)]">{icon}</div>
      </div>
      <div className="text-3xl font-serif text-[var(--text)] mb-2">{value}</div>
      {comparison && (
        <div className={`text-sm ${comparisonColor || 'text-[var(--text3)]'}`}>
          {comparison}
        </div>
      )}
    </div>
  );
}

function formatPhoneNumber(phone: string): string {
  // Simple formatting for French numbers
  if (phone.startsWith('33')) {
    const num = phone.slice(2);
    return `+33 ${num.slice(0, 1)} ${num.slice(1, 3)} ${num.slice(3, 5)} ${num.slice(5)}`;
  }
  return phone;
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

export default function Dashboard() {
  const router = useRouter();
  const [conversationsToday, setConversationsToday] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);
  const [escalationRate, setEscalationRate] = useState(0);
  const [pendingEscalations, setPendingEscalations] = useState<Escalation[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [conversationsYesterday, setConversationsYesterday] = useState(0);
  const [activityPeriod, setActivityPeriod] = useState<'today' | '7days'>('today');

  const fetchMetrics = async () => {
    try {
      const [
        convToday,
        msgToday,
        escRate,
        pendEsc,
        convYesterday,
      ] = await Promise.all([
        getConversationsToday(),
        getMessagesToday(),
        getEscalationRate(),
        getPendingEscalations(),
        getConversationsYesterday(),
      ]);

      setConversationsToday(convToday);
      setMessagesToday(msgToday);
      setEscalationRate(escRate);
      setPendingEscalations(pendEsc);
      setConversationsYesterday(convYesterday);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchActivity = async (period: 'today' | '7days' = 'today') => {
    try {
      if (period === '7days') {
        // For 7 days, aggregate by day
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data, error } = await getSupabaseClient()
          .from('conversations')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString());

        if (error) throw error;

        // Group by day
        const dailyData: { [day: string]: number } = {};
        (data as { created_at: string }[])?.forEach((item) => {
          const day = new Date(item.created_at).toISOString().split('T')[0];
          dailyData[day] = (dailyData[day] || 0) + 1;
        });

        // Convert to hourly format for chart (simulate hours as days)
        const result: HourlyActivity[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dayStr = date.toISOString().split('T')[0];
          result.push({ hour: i, count: dailyData[dayStr] || 0 });
        }
        setHourlyActivity(result);
      } else {
        const activity = await getHourlyActivity();
        setHourlyActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setHourlyActivity([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchMetrics();
      await fetchActivity(activityPeriod);
    };

    loadData();

    // Subscribe to realtime updates
    const channel = getSupabaseClient()
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        async () => {
          await fetchMetrics();
          await fetchActivity(activityPeriod);
        }
      )
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, [activityPeriod]);

  const comparison = conversationsToday - conversationsYesterday;
  const comparisonText = comparison > 0 ? `+${comparison} vs hier` : `${comparison} vs hier`;

  // Prepare chart data
  const chartData = activityPeriod === '7days' 
    ? Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        const hourData = hourlyActivity.find(h => h.hour === i);
        return {
          hour: dayLabel,
          messages: hourData?.count || 0,
        };
      })
    : Array.from({ length: 24 }, (_, i) => {
        const hourData = hourlyActivity.find(h => h.hour === i);
        return {
          hour: `${i}h`,
          messages: hourData?.count || 0,
        };
      });

  // Pie chart data
  const totalConversations = pendingEscalations.length;
  const escalatedCount = pendingEscalations.filter(e => e.has_escalade).length;
  const agentMessages = messagesToday - escalatedCount; // Approximation
  const inProgress = totalConversations - escalatedCount;

  const pieData = [
    { name: 'Messages agent', value: agentMessages, color: 'var(--accent)' },
    { name: 'Escalades', value: escalatedCount, color: 'var(--escalade)' },
    { name: 'En cours', value: inProgress, color: 'var(--text3)' },
  ];

  const handleViewConversation = (phone: string) => {
    // Navigate to conversations with selected phone
    // Since we can't pass state easily, we'll use URL params or localStorage
    localStorage.setItem('selectedPhone', phone);
    router.push('/');
  };

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 bg-[var(--bg)] overflow-y-auto">
        <div className="p-8">
          <h1 className="text-3xl font-serif text-[var(--text)] mb-8">Dashboard</h1>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Conversations aujourd'hui"
              value={conversationsToday}
              icon={<MessageSquare size={20} />}
              comparison={comparisonText}
              comparisonColor={comparison >= 0 ? 'text-[var(--accent)]' : 'text-[var(--escalade)]'}
            />
            <MetricCard
              title="Messages aujourd'hui"
              value={messagesToday}
              icon={<TrendingUp size={20} />}
            />
            <MetricCard
              title="Taux d'escalade (7j)"
              value={`${escalationRate}%`}
              icon={<AlertTriangle size={20} />}
            />
            <MetricCard
              title="Escalades en attente"
              value={pendingEscalations.length}
              icon={<Clock size={20} />}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Activity Chart */}
            <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-[var(--radius)] p-6" style={{ boxShadow: 'var(--shadow)' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-serif text-[var(--text)]">Activité</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActivityPeriod('today');
                      fetchActivity('today');
                    }}
                    className={`px-3 py-1 text-sm rounded-[var(--radius-sm)] ${
                      activityPeriod === 'today'
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg2)] text-[var(--text2)]'
                    }`}
                  >
                    Aujourd&apos;hui
                  </button>
                  <button
                    onClick={() => {
                      setActivityPeriod('7days');
                      fetchActivity('7days');
                    }}
                    className={`px-3 py-1 text-sm rounded-[var(--radius-sm)] ${
                      activityPeriod === '7days'
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg2)] text-[var(--text2)]'
                    }`}
                  >
                    7 jours
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text2)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text2)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--accent)"
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-6" style={{ boxShadow: 'var(--shadow)' }}>
              <h2 className="text-lg font-serif text-[var(--text)] mb-6">Répartition des conversations</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <div className="text-2xl font-serif text-[var(--text)]">{totalConversations}</div>
                <div className="text-sm text-[var(--text2)]">Total</div>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[var(--text2)]">{item.name}</span>
                    </div>
                    <span className="text-[var(--text)] font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Escalations Table */}
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-6" style={{ boxShadow: 'var(--shadow)' }}>
            <h2 className="text-xl font-serif text-[var(--text)] mb-6">Escalades en attente</h2>
            {pendingEscalations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl text-[var(--accent)] mb-4">✓</div>
                <p className="text-lg font-serif italic text-[var(--text3)]">
                  Aucune escalade en attente
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 font-sans text-[var(--text2)] font-medium">
                        Numéro
                      </th>
                      <th className="text-left py-3 px-4 font-sans text-[var(--text2)] font-medium">
                        Dernier message
                      </th>
                      <th className="text-left py-3 px-4 font-sans text-[var(--text2)] font-medium">
                        Heure
                      </th>
                      <th className="text-left py-3 px-4 font-sans text-[var(--text2)] font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEscalations.map((esc) => (
                      <tr key={esc.phone_number} className="border-b border-[var(--border2)] hover:bg-[var(--bg3)]">
                        <td className="py-4 px-4 font-sans text-[var(--text)]">
                          {formatPhoneNumber(esc.phone_number)}
                        </td>
                        <td className="py-4 px-4 font-sans text-[var(--text2)] max-w-xs truncate">
                          {esc.last_message}
                        </td>
                        <td className="py-4 px-4 font-sans text-[var(--text3)]">
                          {formatTimeAgo(esc.last_message_at)}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewConversation(esc.phone_number)}
                            className="px-4 py-2 bg-[var(--accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--accent)]/90 transition-colors font-sans text-sm"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}