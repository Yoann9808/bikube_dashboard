export interface Conversation {
  id: string;
  phone_number: string;
  role: 'user' | 'assistant';
  content: string;
  is_escalade: boolean;
  created_at: string;
}

export interface DashboardConversation {
  phone_number: string;
  last_message_at: string;
  nb_messages: number;
  has_escalade: boolean;
  last_message: string;
}