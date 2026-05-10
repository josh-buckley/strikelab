import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/lib/AuthProvider';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const { signOut, deleteAccount, session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [deleting, setDeleting] = useState(false);

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your training data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
            }
          },
        },
      ]
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Account</ThemedText>
        <View style={styles.backButton} />
      </View>

      {session?.user?.email ? (
        <ThemedText style={styles.email}>{session.user.email}</ThemedText>
      ) : null}

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleSignOut}>
          <ThemedText style={styles.rowText}>Sign Out</ThemedText>
          <Ionicons name="log-out-outline" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.row, styles.destructiveRow]} onPress={handleDeleteAccount} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color="#e53935" />
          ) : (
            <>
              <ThemedText style={styles.destructiveText}>Delete Account</ThemedText>
              <Ionicons name="trash-outline" size={20} color="#e53935" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.warning}>
        Deleting your account permanently removes all your training data, progress, and history.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 13,
    marginBottom: 32,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 12,
  },
  rowText: {
    fontSize: 16,
  },
  destructiveRow: {
    backgroundColor: 'rgba(229,57,53,0.08)',
    minHeight: 56,
  },
  destructiveText: {
    fontSize: 16,
    color: '#e53935',
  },
  warning: {
    fontSize: 12,
    opacity: 0.45,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
