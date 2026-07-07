import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, GestureResponderEvent, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Roundness, Shadows } from '../theme';
import { Storage, MoodLog, Decision } from '../storage';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, ChevronRight, PenTool, Sparkles } from 'lucide-react-native';

interface JournalScreenProps {
  onNavigate: (tab: string) => void;
}

const JOURNAL_PROMPTS = [
  'What is the primary story you are telling yourself about this choice, and is it entirely true?',
  'Where is the line between healthy self-protection and avoiding growth in this dilemma?',
  'Describe the sensation of choosing the path of growth. What does it feel like in your chest and shoulders?',
  'If there was no external pressure or expectation, what is the simplest choice you would make?',
  'Write down three things you are grateful for today, no matter how small.',
  'What is a past decision you made that felt scary at the time but led to a beautiful outcome?',
];

export default function JournalScreen({ onNavigate }: JournalScreenProps) {
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);

  // Mood slider values
  const [clarity, setClarity] = useState(50);
  const [anxiety, setAnxiety] = useState(50);
  const [hopefulness, setHopefulness] = useState(50);

  // Layout widths to calculate slider positions
  const [trackWidths, setTrackWidths] = useState({ clarity: 280, anxiety: 280, hopefulness: 280 });

  // Body check-in values
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const bodyParts = ['Chest', 'Stomach', 'Shoulders', 'Jaw', 'Head', 'Throat'];

  // Journaling prompt state
  const [prompt, setPrompt] = useState('');
  const [journalText, setJournalText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    loadActiveDecision();
    const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length);
    setPrompt(JOURNAL_PROMPTS[randomIndex]);
  }, []);

  const loadActiveDecision = async () => {
    const decisions = await Storage.getDecisions();
    const active = decisions.filter((d) => d.status !== 'Completed');
    if (active.length > 0) {
      setActiveDecision(active[0]);
    } else {
      setActiveDecision(null);
    }
  };

  const getSliderLabel = (val: number, labels: string[]) => {
    const index = Math.min(Math.floor(val / 20), 4);
    return labels[index];
  };

  const clarityLabels = ['Confused', 'Uncertain', 'Neutral', 'Clear', 'Certain'];
  const anxietyLabels = ['Calm', 'Slight', 'Moderate', 'High', 'Overwhelming'];
  const hopeLabels = ['Dread', 'Doubtful', 'Cautious', 'Optimistic', 'Excited'];

  const toggleBodyPart = (part: string) => {
    if (selectedBodyParts.includes(part)) {
      setSelectedBodyParts(selectedBodyParts.filter((p) => p !== part));
    } else {
      setSelectedBodyParts([...selectedBodyParts, part]);
    }
  };

  const handleTouchSlider = (
    event: GestureResponderEvent,
    key: 'clarity' | 'anxiety' | 'hopefulness',
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const x = event.nativeEvent.locationX;
    const width = trackWidths[key];
    const pct = Math.max(0, Math.min(100, Math.round((x / width) * 100)));
    setter(pct);
  };

  const handleSaveReflection = async () => {
    setInsightLoading(true);
    setAiInsight('');
    
    const newLog: MoodLog = {
      clarity,
      anxiety,
      hopefulness,
      bodySensations: selectedBodyParts,
      note: journalText.trim() ? `${prompt}\n\nResponse: ${journalText.trim()}` : undefined,
      timestamp: new Date().toISOString(),
    };

    const moodLogs = await Storage.getMoodLogs();
    await Storage.saveMoodLogs([newLog, ...moodLogs]);

    if (activeDecision) {
      const updated = {
        ...activeDecision,
        initialMood: { clarity, anxiety, hopefulness },
      };
      const decisions = await Storage.getDecisions();
      const updatedList = decisions.map((d) => (d.id === activeDecision.id ? updated : d));
      await Storage.saveDecisions(updatedList);
    }

    const profile = await Storage.getProfile();
    const insight = await OpenAIHelper.generateJournalInsight(
      profile.apiKey,
      clarity,
      anxiety,
      hopefulness,
      selectedBodyParts,
      journalText.trim()
    );

    setAiInsight(insight);
    setInsightLoading(false);
    setSaveSuccess(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={[styles.title, Typography.headlineLg]}>
          {activeDecision
            ? `How are you feeling about ${activeDecision.title}?`
            : 'How are you feeling today?'}
        </Text>
        <Text style={[styles.subtitle, Typography.bodyLg]}>
          Map your current emotions to help clarify your thoughts.
        </Text>
      </View>

      {/* Tactile Sliders */}
      <View style={styles.slidersCard}>
        
        {/* Clarity Slider */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderMeta}>
            <Text style={[styles.sliderName, Typography.labelMd]}>Clarity</Text>
            <Text style={[styles.sliderValue, Typography.labelSm]}>
              {getSliderLabel(clarity, clarityLabels)}
            </Text>
          </View>
          
          <View style={styles.stepTrackWrapper}>
            <LinearGradient
              colors={[Colors.outlineVariant, Colors.secondaryContainer, Colors.primaryFixed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trackGradient}
            />
            <View style={styles.stepNodesRow}>
              {[0, 25, 50, 75, 100].map((val) => {
                const isSelected = Math.abs(clarity - val) < 12;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.stepNode,
                      isSelected && styles.stepNodeSelected,
                      isSelected && { borderColor: Colors.primary }
                    ]}
                    onPress={() => setClarity(val)}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Anxiety Slider */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderMeta}>
            <Text style={[styles.sliderName, Typography.labelMd]}>Anxiety Level</Text>
            <Text style={[styles.sliderValue, Typography.labelSm]}>
              {getSliderLabel(anxiety, anxietyLabels)}
            </Text>
          </View>
          
          <View style={styles.stepTrackWrapper}>
            <LinearGradient
              colors={[Colors.outlineVariant, Colors.tertiaryFixedDim, Colors.tertiaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trackGradient}
            />
            <View style={styles.stepNodesRow}>
              {[0, 25, 50, 75, 100].map((val) => {
                const isSelected = Math.abs(anxiety - val) < 12;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.stepNode,
                      isSelected && styles.stepNodeSelected,
                      isSelected && { borderColor: Colors.tertiary }
                    ]}
                    onPress={() => setAnxiety(val)}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Hopefulness Slider */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderMeta}>
            <Text style={[styles.sliderName, Typography.labelMd]}>Hopefulness</Text>
            <Text style={[styles.sliderValue, Typography.labelSm]}>
              {getSliderLabel(hopefulness, hopeLabels)}
            </Text>
          </View>
          
          <View style={styles.stepTrackWrapper}>
            <LinearGradient
              colors={[Colors.outlineVariant, Colors.primaryContainer, Colors.inversePrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trackGradient}
            />
            <View style={styles.stepNodesRow}>
              {[0, 25, 50, 75, 100].map((val) => {
                const isSelected = Math.abs(hopefulness - val) < 12;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.stepNode,
                      isSelected && styles.stepNodeSelected,
                      isSelected && { borderColor: Colors.secondary }
                    ]}
                    onPress={() => setHopefulness(val)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Body Mapping */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, Typography.labelMd]}>Where do you feel this in your body?</Text>
        <View style={styles.bodyGrid}>
          {bodyParts.map((part) => {
            const isSelected = selectedBodyParts.includes(part);
            return (
              <TouchableOpacity
                key={part}
                style={[styles.bodyChip, isSelected && styles.bodyChipSelected]}
                onPress={() => toggleBodyPart(part)}
              >
                <Text style={[styles.bodyChipText, Typography.labelSm, isSelected && styles.bodyChipTextSelected]}>
                  {part}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Mindful Journaling Prompt */}
      <View style={styles.card}>
        <View style={styles.promptHeader}>
          <PenTool size={16} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.promptTitle, Typography.labelMd]}>Daily Sanctuary Reflection</Text>
        </View>
        <Text style={[styles.promptPrompt, Typography.bodyMd]}>{prompt}</Text>
        <TextInput
          style={[styles.journalInput, Typography.bodyMd]}
          placeholder="Pour your thoughts onto this page. It is entirely private..."
          value={journalText}
          onChangeText={setJournalText}
          multiline
          numberOfLines={6}
          placeholderTextColor={Colors.outline}
        />
      </View>

      {/* Action */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.saveBtn, saveSuccess && styles.saveBtnSuccess]}
          onPress={handleSaveReflection}
        >
          {saveSuccess ? (
            <>
              <Text style={[styles.saveBtnTxt, Typography.labelMd]}>Reflection Saved</Text>
              <CheckCircle2 size={18} color={Colors.onPrimary} style={{ marginLeft: 8 }} />
            </>
          ) : (
            <>
              <Text style={[styles.saveBtnTxt, Typography.labelMd]}>Save Reflection</Text>
              <ChevronRight size={18} color={Colors.onPrimary} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* AI SOMATIC INSIGHT CARD */}
      {(insightLoading || aiInsight) && (
        <View style={[styles.aiInsightCard, Shadows.ambient]}>
          <View style={styles.insightHeader}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={[styles.insightTitle, Typography.labelMd]}>Second Brain Somatic Reflection</Text>
          </View>
          {insightLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.sm }} />
          ) : (
            <>
              <Text style={[styles.insightText, Typography.bodyMd]}>{aiInsight}</Text>
              <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={() => {
                  setSaveSuccess(false);
                  setAiInsight('');
                  onNavigate('reflect');
                }}
              >
                <Text style={[styles.doneBtnTxt, Typography.labelSm]}>Acknowledge & Return</Text>
              </TouchableOpacity>
            </>
          )}
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
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
  },
  slidersCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    marginBottom: Spacing.md,
  },
  sliderRow: {
    gap: Spacing.sm,
  },
  sliderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderName: {
    color: Colors.onSurface,
  },
  sliderValue: {
    color: Colors.onSurfaceVariant,
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Roundness.full,
  },
  stepTrackWrapper: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  trackGradient: {
    height: 6,
    borderRadius: Roundness.full,
    width: '100%',
    opacity: 0.85,
  },
  stepNodesRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  stepNodeSelected: {
    borderWidth: 4,
    transform: [{ scale: 1.25 }],
  },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  bodyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bodyChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Roundness.default,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bodyChipSelected: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: 'transparent',
  },
  bodyChipText: {
    color: Colors.onSurfaceVariant,
  },
  bodyChipTextSelected: {
    color: Colors.onSecondaryContainer,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  promptTitle: {
    color: Colors.primary,
  },
  promptPrompt: {
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  journalInput: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Roundness.default,
    padding: Spacing.md,
    color: Colors.onSurface,
    textAlignVertical: 'top',
    height: 150,
  },
  actionRow: {
    marginTop: Spacing.md,
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
    fontWeight: '600',
  },
  aiInsightCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(82, 96, 72, 0.25)',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  insightTitle: {
    color: Colors.primary,
    fontWeight: '600',
  },
  insightText: {
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    fontSize: 14,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Roundness.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  doneBtnTxt: {
    color: Colors.onPrimary,
    fontWeight: '600',
  },
});
