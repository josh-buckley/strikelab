-- Run this in your Supabase SQL editor to create the new tables

CREATE TABLE IF NOT EXISTS coach_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES coach_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user 
  ON coach_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation 
  ON coach_messages(conversation_id, created_at ASC);

-- Enable RLS
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see their own conversations and messages
CREATE POLICY "Users can view own conversations" 
  ON coach_conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" 
  ON coach_conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
  ON coach_conversations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
  ON coach_conversations FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations" 
  ON coach_messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM coach_conversations 
    WHERE coach_conversations.id = coach_messages.conversation_id 
    AND coach_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in their conversations" 
  ON coach_messages FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM coach_conversations 
    WHERE coach_conversations.id = coach_messages.conversation_id 
    AND coach_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages in their conversations" 
  ON coach_messages FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM coach_conversations 
    WHERE coach_conversations.id = coach_messages.conversation_id 
    AND coach_conversations.user_id = auth.uid()
  ));
