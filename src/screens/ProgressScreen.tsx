import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Roundness } from '../theme';
import { Storage, Decision, MoodLog } from '../storage';
import { Check, Edit3, Bookmark, Smile, ArrowRight, Eye } from 'lucide-react-native';

interface ProgressScreenProps {
  onNavigate: (tab: string, params?: any) => void;
}

interface LedgerItem {
  id: string;
  type: 'decision' | 'mood';
  title: string;
  subtitle: string;
  body: string;
  date: string;
  category?: string;
  moodShift?: string;
  originalItem: Decision | MoodLog;
}

export default function ProgressScreen({ onNavigate }: ProgressScreenProps) {
  const [timelineItems, setTimelineItems] = useState<LedgerItem[]>([]);

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
    const decisions = await Storage.getDecisions();
    const moodLogs = await Storage.getMoodLogs();

    // Map completed decisions to LedgerItems
    const completedDecisionsMapped: LedgerItem[] = decisions
      .filter((d) => d.status === 'Completed')
      .map((d) => {
        // Mood shift text helper
        let shift = 'Resolved';
        if (d.initialMood && d.outcomeMood) {
          const initAnx = d.initialMood.anxiety > 60 ? 'Anxious' : 'Calm';
          const finalAnx = d.outcomeMood.anxiety < 40 ? 'Relieved' : 'Steady';
          shift = `${initAnx} to ${finalAnx}`;
        } else if (d.initialMood) {
          const initAnx = d.initialMood.anxiety > 60 ? 'Anxious to Grounded' : 'Steady Choice';
          shift = initAnx;
        }

        return {
          id: d.id,
          type: 'decision',
          title: 'Decided on ' + d.title,
          subtitle: d.category,
          body: d.outcome || d.description || 'Stepped forward with awareness.',
          date: d.completedAt || d.createdAt,
          category: d.category,
          moodShift: shift,
          originalItem: d,
        };
      });

    // Map mood logs that have notes/reflections to LedgerItems
    const moodsMapped: LedgerItem[] = moodLogs
      .filter((l) => l.note)
      .map((l, index) => {
        // Extract prompt and response
        const parts = l.note?.split('\n\nResponse: ') || [];
        const prompt = parts[0] || 'Reflection Journal';
        const responseText = parts[1] || l.note || '';

        const clarityLabels = ['Confused', 'Uncertain', 'Neutral', 'Clear', 'Certain'];
        const indexClarity = Math.min(Math.floor(l.clarity / 20), 4);
        const clarityWord = clarityLabels[indexClarity];

        return {
          id: 'mood-' + index,
          type: 'mood',
          title: 'Mindful Reflection',
          subtitle: 'Journal',
          body: responseText,
          date: l.timestamp,
          category: 'Reflection',
          moodShift: `${clarityWord} state`,
          originalItem: l,
        };
      });

    // Combine and sort by date descending
    const combined = [...completedDecisionsMapped, ...moodsMapped].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setTimelineItems(combined);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, Typography.headlineLg]}>Growth Ledger</Text>
        <Text style={[styles.subtitle, Typography.bodyLg]}>
          Your chronological timeline of closed decisions, reflections, and emotional progress.
        </Text>
      </View>

      {timelineItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bookmark size={48} color={Colors.outline} style={{ marginBottom: Spacing.md }} />
          <Text style={[styles.emptyTitle, Typography.headlineMd]}>A Blank Page</Text>
          <Text style={[styles.emptyDesc, Typography.bodyMd]}>
            No closed decisions or journal reflections in your ledger yet. Walk down a path in the workspace to start recording your growth.
          </Text>
          <TouchableOpacity style={styles.emptyAction} onPress={() => onNavigate('deepen')}>
            <Text style={[styles.emptyActionTxt, Typography.labelMd]}>Open Workspace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.timelineWrapper}>
          {/* Vertical timeline vertical line */}
          <View style={styles.timelineLine} />

          {timelineItems.map((item) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* Timeline Indicator Badge */}
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.badge,
                    item.type === 'decision'
                      ? styles.badgeDecision
                      : styles.badgeMood,
                  ]}
                >
                  {item.type === 'decision' ? (
                    <Check size={14} color={Colors.onSecondaryContainer} />
                  ) : (
                    <Edit3 size={14} color={Colors.onSurfaceVariant} />
                  )}
                </View>
              </View>

              {/* Entry Card Content */}
              <View style={styles.ledgerCard}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardDate, Typography.labelSm]}>
                    {formatDate(item.date)}
                  </Text>
                  <View style={styles.badgesRow}>
                    {item.category ? (
                      <View style={styles.catBadge}>
                        <Text style={[styles.catBadgeTxt, Typography.labelSm]}>
                          {item.category}
                        </Text>
                      </View>
                    ) : null}
                    {item.moodShift ? (
                      <View style={styles.shiftBadge}>
                        <Text style={[styles.shiftBadgeTxt, Typography.labelSm]}>
                          {item.moodShift}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Text style={[styles.cardTitle, Typography.labelMd]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardBody, Typography.bodyMd]} numberOfLines={4}>
                  {item.body}
                </Text>

                {item.type === 'decision' ? (
                  <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => onNavigate('deepen', { decisionId: item.id })}
                    activeOpacity={0.8}
                  >
                    <Eye size={12} color={Colors.primary} />
                    <Text style={[styles.expandBtnTxt, Typography.labelSm]}>
                      Review Decision Matrix
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
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
  emptyContainer: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  emptyAction: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Roundness.default,
  },
  emptyActionTxt: {
    color: Colors.onPrimary,
  },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: Spacing.sm,
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 10,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  timelineIndicator: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.background,
  },
  badgeDecision: {
    backgroundColor: Colors.secondaryContainer,
  },
  badgeMood: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  ledgerCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.md,
    marginLeft: Spacing.xs,
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
    marginBottom: Spacing.sm,
  },
  cardDate: {
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  catBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Roundness.full,
  },
  catBadgeTxt: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  shiftBadge: {
    backgroundColor: Colors.tertiaryContainer,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Roundness.full,
    opacity: 0.8,
  },
  shiftBadgeTxt: {
    color: Colors.onTertiaryContainer,
    fontSize: 10,
  },
  cardTitle: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  cardBody: {
    color: Colors.onSurfaceVariant,
    opacity: 0.9,
    fontSize: 14,
    lineHeight: 20,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  expandBtnTxt: {
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
});
