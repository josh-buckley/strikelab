import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/lib/AuthProvider';
import { sendMessage } from '@/lib/openai';
import { fetchCoachContext, formatCoachContext } from '@/lib/coachContext';
import {
  fetchConversations,
  fetchMessages,
  createConversation,
  saveMessage,
  updateConversationTitle,
  deleteConversation,
  CoachConversation,
  CoachMessage,
} from '@/lib/coachService';

export default function CoachScreen() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<CoachConversation | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);

  useEffect(() => {
    if (session?.user) loadConversations();
  }, [session?.user]);

  const loadConversations = async () => {
    setListLoading(true);
    const convs = await fetchConversations(session!.user.id);
    setConversations(convs);
    setListLoading(false);
  };

  const openConversation = async (conv: CoachConversation) => {
    setSelectedConv(conv);
    const msgs = await fetchMessages(conv.id);
    setMessages(msgs);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const handleNewChat = async () => {
    if (!session?.user) return;
    const conv = await createConversation(session.user.id, 'New Chat');
    if (conv) {
      setSelectedConv(conv);
      setMessages([]);
      loadConversations();
    }
  };

  const handleDelete = (convId: string) => {
    Alert.alert('Delete Chat', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteConversation(convId);
          if (selectedConv?.id === convId) { setSelectedConv(null); setMessages([]); }
          loadConversations();
        },
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConv || !session?.user) return;
    const userMsg = input.trim();
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Save user message
    await saveMessage(selectedConv.id, 'user', userMsg);
    const updatedUser = [...messages, { id: 'tmp-u', conversation_id: selectedConv.id, role: 'user' as const, content: userMsg, created_at: new Date().toISOString() }];
    setMessages(updatedUser);

    // Auto-title from first message
    if (messages.length === 0) {
      const title = userMsg.length > 40 ? userMsg.substring(0, 40) + '...' : userMsg;
      await updateConversationTitle(selectedConv.id, title);
    }

    // Get AI response
    setLoading(true);
    try {
      // Fetch user's training data for context
      const ctx = await fetchCoachContext(session!.user.id);
      const contextStr = formatCoachContext(ctx);

      const response = await sendMessage([
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userMsg },
      ], contextStr);

      await saveMessage(selectedConv.id, 'assistant', response);
      setMessages(prev => [...prev, {
        id: 'tmp-a', conversation_id: selectedConv.id, role: 'assistant' as const,
        content: response, created_at: new Date().toISOString(),
      }]);
      loadConversations();
    } catch {
      Alert.alert('Error', 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ---- CONVERSATION LIST VIEW ----
  if (!selectedConv) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>coach</ThemedText>
          <TouchableOpacity style={styles.newButton} onPress={handleNewChat}>
            <IconSymbol name="plus" size={22} color="#FFD700" />
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {listLoading ? (
            <ThemedText style={styles.emptyText}>Loading...</ThemedText>
          ) : conversations.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyTitle}>No conversations yet</ThemedText>
              <ThemedText style={styles.emptySub}>Tap + to start chatting with your coach</ThemedText>
            </ThemedView>
          ) : (
            conversations.map(conv => (
              <TouchableOpacity key={conv.id} style={styles.convCard} onPress={() => openConversation(conv)} onLongPress={() => handleDelete(conv.id)}>
                <ThemedView style={styles.convInfo}>
                  <ThemedText style={styles.convTitle} numberOfLines={1}>{conv.title}</ThemedText>
                  <ThemedText style={styles.convPreview} numberOfLines={1}>{conv.last_message}</ThemedText>
                </ThemedView>
                <ThemedText style={styles.convDate}>{formatDate(conv.updated_at)}</ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </ThemedView>
    );
  }

  // ---- CHAT VIEW ----
  return (
    <ThemedView style={styles.container}>
      {/* Chat header */}
      <ThemedView style={styles.chatHeader}>
        <TouchableOpacity onPress={() => { setSelectedConv(null); loadConversations(); }}>
          <IconSymbol name="chevron.left" size={24} color="#FFD700" />
        </TouchableOpacity>
        <ThemedText style={styles.chatTitle} numberOfLines={1}>{selectedConv.title}</ThemedText>
        <TouchableOpacity onPress={() => handleDelete(selectedConv.id)}>
          <IconSymbol name="trash" size={20} color="#666" />
        </TouchableOpacity>
      </ThemedView>

      {/* Messages */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView ref={scrollRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((msg, i) => (
            <ThemedView key={msg.id || i} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              {msg.role === 'user' ? (
                <ThemedText style={[styles.messageText, styles.userText]}>
                  {msg.content}
                </ThemedText>
              ) : (
                <Markdown
                  style={{
                    body: { fontFamily: 'Poppins', fontSize: 15, lineHeight: 21, color: '#ddd' },
                    strong: { fontFamily: 'PoppinsSemiBold', color: '#FFD700' },
                    blockquote: { backgroundColor: 'transparent', borderLeftColor: '#FFD700', borderLeftWidth: 2, paddingLeft: 8, marginVertical: 4 },
                    blockquoteText: { color: '#999', fontStyle: 'italic' },
                    paragraph: { marginVertical: 2 },
                  }}
                >
                  {msg.content}
                </Markdown>
              )}
            </ThemedView>
          ))}
          {loading && (
            <ThemedView style={styles.loadingBubble}>
              <Animated.View style={[styles.loadingDot, { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
            </ThemedView>
          )}
        </ScrollView>

        {/* Input bar */}
        <ThemedView style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach anything..."
            placeholderTextColor="#555"
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity style={[styles.sendButton, !input.trim() && styles.sendDisabled]} onPress={handleSend} disabled={!input.trim()}>
            <IconSymbol name="arrow.up" size={18} color={input.trim() ? '#151718' : '#666'} />
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80 },

  // List view
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32, fontFamily: 'PoppinsSemiBold', lineHeight: 40,
    textDecorationLine: 'line-through', textDecorationColor: '#FFD700', color: '#fff',
  },
  newButton: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: '#FFD700',
    alignItems: 'center', justifyContent: 'center',
    marginTop: -2,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  convCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1c1c1e',
  },
  convInfo: { flex: 1, marginRight: 12 },
  convTitle: { fontFamily: 'Poppins', fontSize: 16, color: '#fff' },
  convPreview: { fontFamily: 'Poppins', fontSize: 13, color: '#666', marginTop: 2 },
  convDate: { fontFamily: 'Poppins', fontSize: 12, color: '#555' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontFamily: 'PoppinsSemiBold', fontSize: 18, color: '#666' },
  emptySub: { fontFamily: 'Poppins', fontSize: 14, color: '#555', marginTop: 8, textAlign: 'center' },
  emptyText: { fontFamily: 'Poppins', fontSize: 14, color: '#555', textAlign: 'center', marginTop: 40 },

  // Chat view
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1c1c1e',
  },
  chatTitle: { fontFamily: 'Poppins', fontSize: 17, color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8, gap: 10 },
  messageBubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#FFD700' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#2c2c2e' },
  messageText: { fontFamily: 'Poppins', fontSize: 15, lineHeight: 21 },
  userText: { color: '#fff' },
  assistantText: { color: '#ddd' },
  loadingBubble: { alignSelf: 'flex-start', padding: 12, backgroundColor: '#1c1c1e', borderRadius: 16 },
  loadingDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#FFD700',
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#1c1c1e',
  },
  textInput: {
    flex: 1, fontFamily: 'Poppins', fontSize: 15, color: '#fff',
    backgroundColor: '#1c1c1e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: '#333' },
});
