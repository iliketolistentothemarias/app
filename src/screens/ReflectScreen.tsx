import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Colors, Typography, Spacing, Roundness, Shadows } from '../theme';
import { Storage, Decision, MoodLog } from '../storage';
import { Heart, Brain, Briefcase, Home, Activity, ArrowRight, Compass, ShieldAlert, FileText } from 'lucide-react-native';

interface ReflectScreenProps {
  onNavigate: (tab: string, params?: any) => void;
}

export default function ReflectScreen({ onNavigate }: ReflectScreenProps) {
  const [username, setUsername] = useState('Alex');
  const [activeDecisions, setActiveDecisions] = useState<Decision[]>([]);
  const [recentMood, setRecentMood] = useState<MoodLog | null>(null);
  const [moodTrend, setMoodTrend] = useState({ calm: 50, anxiety: 50, clarity: 50 });

  // Pulsing animation for Safe Zone CTA
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();

    // Fade-in screen transition
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse loop for the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    const profile = await Storage.getProfile();
    setUsername(profile.username || 'Alex');

    const decisions = await Storage.getDecisions();
    const active = decisions.filter((d) => d.status !== 'Completed');
    setActiveDecisions(active);

    const logs = await Storage.getMoodLogs();
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentMood(sorted[0]);

      const lastEntries = sorted.slice(0, 5);
      let totalCalm = 0;
      let totalAnxiety = 0;
      let totalClarity = 0;
      lastEntries.forEach((l) => {
        totalCalm += l.hopefulness;
        totalAnxiety += l.anxiety;
        totalClarity += l.clarity;
      });
      setMoodTrend({
        calm: Math.round(totalCalm / lastEntries.length),
        anxiety: Math.round(totalAnxiety / lastEntries.length),
        clarity: Math.round(totalClarity / lastEntries.length),
      });
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'career':
      case 'work':
        return <Briefcase size={20} color={Colors.primary} />;
      case 'relocation':
      case 'home':
        return <Home size={20} color={Colors.secondary} />;
      case 'health':
        return <Activity size={20} color={Colors.tertiary} />;
      case 'finance':
        return <Compass size={20} color={Colors.primaryContainer} />;
      default:
        return <FileText size={20} color={Colors.onSurfaceVariant} />;
    }
  };

  return (
    <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, Typography.headlineLg]}>
            {getGreeting()}, {username}.
          </Text>
          <Text style={[styles.subtitle, Typography.bodyLg]}>
            Let's take a breath and center ourselves for the day.
          </Text>
        </View>

        {/* EMPATHETIC ADAPTIVE BANNER */}
        {recentMood && recentMood.anxiety > 60 ? (
          <View style={[styles.empathyCard, { borderColor: Colors.anxiety, backgroundColor: 'rgba(232, 189, 172, 0.12)' }, Shadows.ambient]}>
            <View style={styles.empathyHeader}>
              <ShieldAlert size={20} color={Colors.tertiary} />
              <Text style={[styles.empathyTitle, Typography.labelMd, { color: Colors.tertiary }]}>Gentle Pause Needed</Text>
            </View>
            <Text style={[styles.empathyText, Typography.bodyMd]}>
              Alex, your recent anxiety check-in is high ({recentMood.anxiety}%). Let's take 60 seconds to release tension and align your breathing.
            </Text>
            <TouchableOpacity style={styles.empathyAction} onPress={() => onNavigate('safezone')}>
              <Text style={[styles.empathyActionTxt, Typography.labelSm, { color: Colors.tertiary }]}>Begin Safe Zone Breathing</Text>
              <ArrowRight size={14} color={Colors.tertiary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        ) : recentMood && recentMood.clarity < 40 ? (
          <View style={[styles.empathyCard, { borderColor: Colors.calm, backgroundColor: 'rgba(195, 203, 163, 0.12)' }, Shadows.ambient]}>
            <View style={styles.empathyHeader}>
              <Brain size={20} color={Colors.primary} />
              <Text style={[styles.empathyTitle, Typography.labelMd, { color: Colors.primary }]}>Foggy Thoughts?</Text>
            </View>
            <Text style={[styles.empathyText, Typography.bodyMd]}>
              Your mind clarity baseline is currently low. Discussing your dilemmas with the Second Brain chatbot can help sort the fog.
            </Text>
            <TouchableOpacity style={styles.empathyAction} onPress={() => onNavigate('deepen')}>
              <Text style={[styles.empathyActionTxt, Typography.labelSm, { color: Colors.primary }]}>Consult Second Brain</Text>
              <ArrowRight size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ACTIVE VOICE DIALOGUE PROMPT */}
        {activeDecisions.length > 0 && (
          <View style={[styles.voicePromptCard, Shadows.ambient]}>
            <View style={styles.voicePromptHeader}>
              <Brain size={18} color={Colors.primary} />
              <Text style={[styles.voicePromptTitle, Typography.labelMd]}>feelAI Second Brain Inquiry</Text>
            </View>
            <Text style={[styles.voicePromptText, Typography.bodyMd]}>
              "{username}, you have listed {activeDecisions[0].pros.length + activeDecisions[0].cons.length} perspective items on '{activeDecisions[0].title}'. Let's talk this out in a voice session to uncover any hidden blind spots."
            </Text>
            <TouchableOpacity style={styles.voicePromptBtn} onPress={() => onNavigate('voice')}>
              <Text style={[styles.voicePromptBtnTxt, Typography.labelSm]}>Start Voice Dialogue</Text>
              <ArrowRight size={14} color={Colors.onPrimary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Safe Zone pulsing button container */}
        <Animated.View style={[styles.safeZoneWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={styles.safeZoneButton} onPress={() => onNavigate('safezone')} activeOpacity={0.9}>
            <Heart size={24} color={Colors.onSecondary} fill={Colors.onSecondary} />
            <Text style={[styles.safeZoneText, Typography.labelMd]}>Enter Safe Zone</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bento Layout Row */}
        <View style={styles.grid}>
          {/* Active Decisions Column */}
          <View style={styles.decisionsSection}>
            <View style={styles.sectionHeader}>
              <Compass size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, Typography.headlineMd]}>Active Decisions</Text>
            </View>

            {activeDecisions.length === 0 ? (
              <TouchableOpacity style={styles.emptyCard} onPress={() => onNavigate('deepen')} activeOpacity={0.8}>
                <Brain size={28} color={Colors.outline} />
                <Text style={[styles.emptyCardTitle, Typography.labelMd]}>Clear Your Mind</Text>
                <Text style={[styles.emptyCardDesc, Typography.labelSm]}>Weigh your options with visual pros and cons.</Text>
                <Text style={[styles.emptyCardAction, Typography.labelSm]}>Create Workspace +</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.decisionList}>
                {activeDecisions.map((decision) => (
                  <TouchableOpacity
                    key={decision.id}
                    style={styles.decisionCard}
                    onPress={() => onNavigate('deepen', { decisionId: decision.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.iconBg}>{getCategoryIcon(decision.category)}</View>
                      <View style={styles.statusChip}>
                        <Text style={[styles.statusText, Typography.labelSm]}>{decision.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardTitle, Typography.labelMd]} numberOfLines={1}>
                      {decision.title}
                    </Text>
                    <Text style={[styles.cardDesc, Typography.bodyMd]} numberOfLines={2}>
                      {decision.description || 'Exploring options and feelings.'}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={[styles.footerText, Typography.labelSm]}>Explore thoughts</Text>
                      <ArrowRight size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Recent Flow (Mood / Emotion summary) */}
          <View style={styles.flowSection}>
            <View style={styles.sectionHeader}>
              <Activity size={20} color={Colors.tertiary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, Typography.headlineMd]}>Recent Flow</Text>
            </View>

            <View style={styles.flowCard}>
              {recentMood?.note ? (
                <Text style={[styles.journalExcerpt, Typography.bodyMd]}>
                  "{recentMood.note.split('\n\nResponse: ')[1] || recentMood.note}"
                </Text>
              ) : (
                <Text style={[styles.journalExcerptPlaceholder, Typography.bodyMd]}>
                  "Finding more peace in the mornings, but evenings feel cluttered."
                </Text>
              )}

              {/* Emotional Trend Indicators */}
              <View style={styles.trendList}>
                <View style={styles.trendRow}>
                  <Text style={[styles.trendLabel, Typography.labelSm]}>Calm</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${moodTrend.calm}%`, backgroundColor: Colors.calm }]} />
                  </View>
                </View>

                <View style={styles.trendRow}>
                  <Text style={[styles.trendLabel, Typography.labelSm]}>Anxiety</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${moodTrend.anxiety}%`, backgroundColor: Colors.anxiety }]} />
                  </View>
                </View>

                <View style={styles.trendRow}>
                  <Text style={[styles.trendLabel, Typography.labelSm]}>Clarity</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${moodTrend.clarity}%`, backgroundColor: Colors.clarity }]} />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.jotButton} onPress={() => onNavigate('journal')} activeOpacity={0.8}>
                <Text style={[styles.jotButtonText, Typography.labelMd]}>Jot a thought</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
  },
  empathyCard: {
    borderWidth: 1.5,
    borderRadius: Roundness.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  empathyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  empathyTitle: {
    fontWeight: '600',
  },
  empathyText: {
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    fontSize: 14,
  },
  empathyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  empathyActionTxt: {
    fontWeight: '600',
  },
  safeZoneWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  safeZoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Roundness.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  safeZoneText: {
    color: Colors.onSecondary,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  grid: {
    gap: Spacing.lg,
  },
  decisionsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.onSurface,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
  },
  emptyCardTitle: {
    color: Colors.onSurface,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptyCardDesc: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.md,
  },
  emptyCardAction: {
    color: Colors.primary,
    fontWeight: '600',
  },
  decisionList: {
    gap: Spacing.md,
  },
  decisionCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBg: {
    backgroundColor: 'rgba(106, 121, 95, 0.1)',
    padding: 8,
    borderRadius: Roundness.default,
  },
  statusChip: {
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Roundness.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  statusText: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  cardTitle: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
    marginBottom: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  flowSection: {
    flex: 1,
  },
  flowCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  journalExcerpt: {
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(117, 85, 71, 0.3)',
    paddingLeft: Spacing.md,
    marginVertical: Spacing.sm,
  },
  journalExcerptPlaceholder: {
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(117, 85, 71, 0.3)',
    paddingLeft: Spacing.md,
    marginVertical: Spacing.sm,
    opacity: 0.5,
  },
  trendList: {
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendLabel: {
    color: Colors.onSurfaceVariant,
    width: 60,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Roundness.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: Roundness.full,
  },
  jotButton: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Roundness.default,
    paddingVertical: 12,
    alignItems: 'center',
  },
  jotButtonText: {
    color: Colors.onSurfaceVariant,
  },
  voicePromptCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(106, 121, 95, 0.25)',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  voicePromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voicePromptTitle: {
    color: Colors.primary,
    fontWeight: '600',
  },
  voicePromptText: {
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    fontSize: 14,
  },
  voicePromptBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Roundness.full,
    marginTop: Spacing.xs,
  },
  voicePromptBtnTxt: {
    color: Colors.onPrimary,
    fontWeight: '600',
  },
});
