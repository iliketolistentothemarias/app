import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Typography, Spacing, Roundness } from '../theme';
import { Storage, UserProfile } from '../storage';
import { Save, ShieldAlert, Key, User, Trash2 } from 'lucide-react-native';

interface SettingsScreenProps {
  onNavigate: (tab: string) => void;
}

export default function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [username, setUsername] = useState('Alex');
  const [apiKey, setApiKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await Storage.getProfile();
    setUsername(profile.username || 'Alex');
    setApiKey(profile.apiKey || '');
  };

  const handleSaveSettings = async () => {
    const updated: UserProfile = {
      username: username.trim() || 'Alex',
      apiKey: apiKey.trim(),
    };
    await Storage.saveProfile(updated);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onNavigate('reflect');
    }, 1200);
  };

  const handleResetData = () => {
    // For React Native / Web compatibility, we can alert or confirm
    const confirmReset = () => {
      Storage.resetAll().then(() => {
        loadProfile();
        Alert.alert('Data Reset', 'All local decision records and mood logs have been cleared.');
        onNavigate('reflect');
      });
    };

    // Use Alert.alert if mobile, otherwise confirm
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Are you absolutely sure you want to clear all your decision data, mood logs, and API configurations? This cannot be undone.')) {
        confirmReset();
      }
    } else {
      Alert.alert(
        'Reset All Data?',
        'Are you absolutely sure you want to clear all your decision data, mood logs, and API configurations? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Everything', style: 'destructive', onPress: confirmReset },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, Typography.headlineLg]}>Settings</Text>
        <Text style={[styles.subtitle, Typography.bodyLg]}>
          Configure your digital sanctuary profile and secure local credentials.
        </Text>
      </View>

      {/* User Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, Typography.labelMd]}>Personal Profile</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, Typography.labelSm]}>Preferred Name / Avatar Name</Text>
          <TextInput
            style={[styles.input, Typography.bodyMd]}
            placeholder="Alex"
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={Colors.outline}
          />
        </View>
      </View>

      {/* AI Credentials */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Key size={18} color={Colors.secondary} style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, Typography.labelMd]}>OpenAI Credentials</Text>
        </View>
        <Text style={[styles.cardDesc, Typography.bodyMd]}>
          To unlock real-time cognitive deepening and customized reflections, provide an OpenAI API key. The key is stored 100% locally on your device storage.
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, Typography.labelSm]}>OpenAI API Key (sk-...)</Text>
          <TextInput
            style={[styles.input, Typography.bodyMd]}
            placeholder="sk-..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            placeholderTextColor={Colors.outline}
          />
        </View>
      </View>

      {/* Privacy Control */}
      <View style={[styles.card, styles.dangerCard]}>
        <View style={styles.cardHeader}>
          <ShieldAlert size={18} color={Colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, Typography.labelMd, { color: Colors.error }]}>Privacy & Safety</Text>
        </View>
        <Text style={[styles.cardDesc, Typography.bodyMd]}>
          Your mental health logs are completely private and stored locally. Clearing this data will permanently erase your growth ledger.
        </Text>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetData} activeOpacity={0.8}>
          <Trash2 size={16} color={Colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.resetBtnTxt, Typography.labelMd]}>Clear All Sanctuary Data</Text>
        </TouchableOpacity>
      </View>

      {/* Action */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.saveBtn, saveSuccess && styles.saveBtnSuccess]}
          onPress={handleSaveSettings}
        >
          <Save size={18} color={Colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.saveBtnTxt, Typography.labelMd]}>
            {saveSuccess ? 'Settings Saved' : 'Save Credentials'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerCard: {
    borderColor: 'rgba(186, 26, 26, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    color: Colors.onSurface,
  },
  cardDesc: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    color: Colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Roundness.default,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    borderRadius: Roundness.default,
    paddingVertical: 12,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(186, 26, 26, 0.02)',
  },
  resetBtnTxt: {
    color: Colors.error,
  },
  actionRow: {
    marginTop: Spacing.lg,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Roundness.xl,
  },
  saveBtnSuccess: {
    backgroundColor: Colors.secondaryContainer,
  },
  saveBtnTxt: {
    color: Colors.onPrimary,
  },
});
