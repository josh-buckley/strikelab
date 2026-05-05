import { supabase } from './supabase';

export interface CoachConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface CoachMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Create a new conversation
export async function createConversation(userId: string, title = 'New Chat'): Promise<CoachConversation | null> {
  const { data, error } = await (supabase
    .from('coach_conversations') as any)
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) { console.error('Error creating conversation:', error); return null; }
  return data as CoachConversation;
}

// Get all conversations for a user, ordered by most recent
export async function fetchConversations(userId: string): Promise<CoachConversation[]> {
  const { data, error } = await (supabase
    .from('coach_conversations') as any)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  // Fetch last message preview for each conversation
  const conversations = await Promise.all(
    (data as CoachConversation[]).map(async (conv) => {
      const { data: msgs } = await (supabase
        .from('coach_messages') as any)
        .select('content')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        ...conv,
        last_message: msgs?.[0]?.content?.substring(0, 80) || 'No messages yet',
      };
    })
  );

  return conversations;
}

// Get all messages for a conversation
export async function fetchMessages(conversationId: string): Promise<CoachMessage[]> {
  const { data, error } = await (supabase
    .from('coach_messages') as any)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as CoachMessage[];
}

// Save a message
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  await (supabase.from('coach_messages') as any).insert({
    conversation_id: conversationId,
    role,
    content,
  });

  // Update conversation timestamp
  await (supabase.from('coach_conversations') as any)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}

// Update conversation title (based on first user message)
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  await (supabase.from('coach_conversations') as any)
    .update({ title })
    .eq('id', conversationId);
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  await (supabase.from('coach_messages') as any).delete().eq('conversation_id', conversationId);
  await (supabase.from('coach_conversations') as any).delete().eq('id', conversationId);
}
