import { getSupabaseClient } from './supabase';

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface Escalation {
  phone_number: string;
  last_message_at: string;
  nb_messages: number;
  has_escalade: boolean;
  last_message: string;
}

// Conversations aujourd'hui
export async function getConversationsToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await getSupabaseClient()
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString())
    .eq('role', 'user');

  if (error) throw error;
  return count || 0;
}

// Messages aujourd'hui
export async function getMessagesToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await getSupabaseClient()
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());

  if (error) throw error;
  return count || 0;
}

// Taux d'escalade (7 derniers jours)
export async function getEscalationRate(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await getSupabaseClient()
    .from('dashboard_conversations')
    .select('has_escalade')
    .gte('last_message_at', sevenDaysAgo.toISOString());

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  const escalated = (data as { has_escalade: boolean }[]).filter(item => item.has_escalade).length;
  return Math.round((escalated / data.length) * 100);
}

// Escalades en attente
export async function getPendingEscalations(): Promise<Escalation[]> {
  const { data, error } = await getSupabaseClient()
    .from('dashboard_conversations')
    .select('*')
    .eq('has_escalade', true)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Activité par heure (aujourd'hui)
export async function getHourlyActivity(targetDate?: Date): Promise<HourlyActivity[]> {
  const date = targetDate || new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await getSupabaseClient()
    .from('conversations')
    .select('created_at')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (error) throw error;

  // Group by hour
  const hourlyData: { [hour: number]: number } = {};
  (data as { created_at: string }[])?.forEach((item) => {
    const hour = new Date(item.created_at).getHours();
    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
  });

  // Convert to array
  const result: HourlyActivity[] = [];
  for (let i = 0; i < 24; i++) {
    result.push({ hour: i, count: hourlyData[i] || 0 });
  }

  return result;
}

// Conversations hier (pour comparaison)
export async function getConversationsYesterday(): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfYesterday = new Date(yesterday);
  startOfYesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const { count, error } = await getSupabaseClient()
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfYesterday.toISOString())
    .lte('created_at', endOfYesterday.toISOString())
    .eq('role', 'user');

  if (error) throw error;
  return count || 0;
}