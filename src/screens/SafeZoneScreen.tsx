import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacing, Roundness } from '../theme';
import { Shield, Wind, Eye, Compass, PhoneCall, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';

const DISTORTIONS = [
  {
    name: 'Catastrophizing',
    description: 'Expecting the worst possible outcome, magnifying risk, and assuming you won\'t be able to cope.',
    example: '"If I fail this presentation, I\'ll lose my job, my career will be ruined, and I\'ll lose my apartment."',
    reframe: 'Identify: (1) What is the worst-case scenario? (2) What is the absolute best-case scenario? (3) What is the most realistic or likely outcome? Map out coping strategies for the likely outcome.',
  },
  {
    name: 'All-or-Nothing Thinking',
    description: 'Viewing things in black-and-white categories. If a situation falls short of perfect, you see it as a total failure.',
    example: '"I ate one cookie, so my diet is completely ruined. I might as well eat the whole box."',
    reframe: 'Introduce shades of gray. Evaluate the situation on a scale of 0 to 100. Eating one cookie is a 5/100 slip-up, leaving 95% of your progress intact.',
  },
  {
    name: 'Emotional Reasoning',
    description: 'Assuming that your negative emotions reflect the truth of the situation: "I feel it, therefore it must be true."',
    example: '"I feel so anxious about this flight, which must mean it is extremely dangerous and going to crash."',
    reframe: 'Separate feelings from facts. Write down: "I am feeling [emotion], but the concrete evidence shows [fact]. Feeling a danger does not equal actual danger."',
  },
  {
    name: 'Overgeneralization',
    description: 'Taking a single negative event and seeing it as a never-ending pattern of defeat, using words like "always" or "never".',
    example: '"He didn\'t reply to my message. People always ignore me, and I will always be lonely."',
    reframe: 'Find counter-examples. Challenge words like "always" or "never" with specific facts: "Actually, yesterday Sarah called me, and my coworker texted me this morning. This is just one instance of delay."',
  },
];

export default function SafeZoneScreen() {
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'cbt' | 'crisis'>('breathing');

  // Breathing variables
  const [breathState, setBreathState] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold (Empty)'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Grounding check state
  const [groundingStep, setGroundingStep] = useState(1);
  const [groundingCheck, setGroundingCheck] = useState<boolean[]>([false, false, false, false, false]);
  const groundingPrompts = [
    { num: '5', label: 'Things you can SEE', desc: 'Look around. Focus on small details, like the texture of a leaf, a reflection, or a shape on the wall.' },
    { num: '4', label: 'Things you can TOUCH', desc: 'Notice the physical contact. Feel your feet on the floor, the fabric of your clothes, or touch a cold surface.' },
    { num: '3', label: 'Things you can HEAR', desc: 'Close your eyes. Listen for distant traffic, a birds song, the hum of a fan, or your own breath.' },
    { num: '2', label: 'Things you can SMELL', desc: 'Breathe in. Can you smell coffee, wood, rain, or the fabric of your shirt? If not, recall a favorite scent.' },
    { num: '1', label: 'Thing you can TASTE', desc: 'Notice any taste. Take a sip of cold water, chew mint gum, or notice the neutral taste in your mouth.' },
  ];

  // CBT distortion details index
  const [openDistortionIndex, setOpenDistortionIndex] = useState<number | null>(null);

  // Box Breathing Loop Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'breathing') {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev === 1) {
            // Transition breath phase
            setBreathState((state) => {
              if (state === 'Inhale') {
                animateCircle(2); // Expand
                return 'Hold';
              }
              if (state === 'Hold') {
                animateCircle(1); // Contract
                return 'Exhale';
              }
              if (state === 'Exhale') {
                return 'Hold (Empty)';
              }
              animateCircle(1.5); // Prepare to inhale
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const animateCircle = (toValue: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration: 4000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const resetGrounding = () => {
    setGroundingStep(1);
    setGroundingCheck([false, false, false, false, false]);
  };

  const handleCheckGroundingStep = (index: number) => {
    const updated = [...groundingCheck];
    updated[index] = !updated[index];
    setGroundingCheck(updated);
    if (index === groundingStep - 1 && groundingStep < 5) {
      setGroundingStep(groundingStep + 1);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Shield size={36} color={Colors.secondary} style={{ marginBottom: Spacing.sm }} />
        <Text style={[styles.title, Typography.headlineLg]}>Digital Sanctuary Safe Zone</Text>
        <Text style={[styles.subtitle, Typography.bodyLg]}>
          A collection of gentle exercises and immediate support options when things feel overwhelming.
        </Text>
      </View>

      {/* Selector Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'breathing' && styles.tabActive]}
          onPress={() => setActiveTab('breathing')}
        >
          <Wind size={16} color={activeTab === 'breathing' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant} />
          <Text style={[styles.tabTxt, Typography.labelSm, activeTab === 'breathing' && styles.tabTxtActive]}>
            Breathing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'grounding' && styles.tabActive]}
          onPress={() => setActiveTab('grounding')}
        >
          <Eye size={16} color={activeTab === 'grounding' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant} />
          <Text style={[styles.tabTxt, Typography.labelSm, activeTab === 'grounding' && styles.tabTxtActive]}>
            Grounding
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cbt' && styles.tabActive]}
          onPress={() => setActiveTab('cbt')}
        >
          <Compass size={16} color={activeTab === 'cbt' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant} />
          <Text style={[styles.tabTxt, Typography.labelSm, activeTab === 'cbt' && styles.tabTxtActive]}>
            CBT Prompts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'crisis' && styles.tabActive]}
          onPress={() => setActiveTab('crisis')}
        >
          <PhoneCall size={16} color={activeTab === 'crisis' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant} />
          <Text style={[styles.tabTxt, Typography.labelSm, activeTab === 'crisis' && styles.tabTxtActive]}>
            Crisis Line
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {activeTab === 'breathing' && (
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, Typography.headlineMd]}>Box Breathing</Text>
          <Text style={[styles.cardDesc, Typography.bodyMd]}>
            Slow down your heart rate and settle your nervous system with a simple box breathing sequence.
          </Text>

          {/* Visual Breathing Circle */}
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor:
                    breathState === 'Inhale'
                      ? 'rgba(216, 232, 200, 0.4)'
                      : breathState === 'Exhale'
                      ? 'rgba(255, 219, 205, 0.4)'
                      : 'rgba(239, 238, 234, 0.6)',
                },
              ]}
            >
              <Text style={[styles.timerNum, Typography.displayLg]}>{breathTimer}</Text>
              <Text style={[styles.timerTxt, Typography.labelMd]}>{breathState}</Text>
            </Animated.View>
          </View>
        </View>
      )}

      {activeTab === 'grounding' && (
        <View style={styles.cardContent}>
          <View style={styles.groundingHeader}>
            <Text style={[styles.cardTitle, Typography.headlineMd]}>5-4-3-2-1 Sensory Grounding</Text>
            <TouchableOpacity onPress={resetGrounding}>
              <Text style={[styles.resetTxt, Typography.labelSm]}>Reset Checklist</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardDesc, Typography.bodyMd]}>
            Center yourself by identifying things in your current physical environment. Focus on each step slowly.
          </Text>

          <View style={styles.groundingList}>
            {groundingPrompts.map((p, index) => {
              const isChecked = groundingCheck[index];
              const isAvailable = index < groundingStep;
              return (
                <TouchableOpacity
                  key={p.num}
                  style={[
                    styles.groundingItem,
                    isChecked && styles.groundingItemChecked,
                    !isAvailable && styles.groundingItemDisabled,
                  ]}
                  disabled={!isAvailable}
                  onPress={() => handleCheckGroundingStep(index)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.numBadge, isChecked && styles.numBadgeChecked]}>
                    <Text style={[styles.numBadgeTxt, Typography.labelMd]}>
                      {isChecked ? '✓' : p.num}
                    </Text>
                  </View>
                  <View style={styles.groundingText}>
                    <Text style={[styles.groundingLabel, Typography.labelMd]}>{p.label}</Text>
                    {isAvailable && (
                      <Text style={[styles.groundingDesc, Typography.bodyMd]}>{p.desc}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {activeTab === 'cbt' && (
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, Typography.headlineMd]}>CBT Cognitive Reframing</Text>
          <Text style={[styles.cardDesc, Typography.bodyMd]}>
            We often view situations through cognitive distortions—unconscious mental filters that increase anxiety. Select a distortion below to inspect its reframe pattern.
          </Text>

          <View style={styles.distortionList}>
            {DISTORTIONS.map((d, index) => {
              const isOpen = openDistortionIndex === index;
              return (
                <View key={d.name} style={styles.distortionItem}>
                  <TouchableOpacity
                    style={styles.distortionHeader}
                    onPress={() => setOpenDistortionIndex(isOpen ? null : index)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.distortionTitleRow}>
                      <AlertTriangle size={16} color={Colors.tertiary} style={{ marginRight: 8 }} />
                      <Text style={[styles.distortionName, Typography.labelMd]}>{d.name}</Text>
                    </View>
                    {isOpen ? <ChevronUp size={16} color={Colors.outline} /> : <ChevronDown size={16} color={Colors.outline} />}
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.distortionBody}>
                      <Text style={[styles.distBodyLabel, Typography.labelSm]}>What is it?</Text>
                      <Text style={[styles.distBodyTxt, Typography.bodyMd]}>{d.description}</Text>

                      <Text style={[styles.distBodyLabel, Typography.labelSm]}>Example thought</Text>
                      <Text style={[styles.distBodyTxt, Typography.bodyMd, styles.italic]}>{d.example}</Text>

                      <View style={styles.distReframeCard}>
                        <Text style={[styles.reframeCardTitle, Typography.labelSm]}>Mindful Reframe Prompt</Text>
                        <Text style={[styles.reframeCardTxt, Typography.bodyMd]}>{d.reframe}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {activeTab === 'crisis' && (
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, Typography.headlineMd]}>Immediate Crisis Support</Text>
          <Text style={[styles.cardDesc, Typography.bodyMd]}>
            If you are in immediate distress or danger, please reach out to professional services. They are free, confidential, and available 24/7.
          </Text>

          <View style={styles.directoryList}>
            <View style={styles.directoryCard}>
              <Text style={[styles.dirTitle, Typography.labelMd]}>988 Suicide & Crisis Lifeline</Text>
              <Text style={[styles.dirDesc, Typography.bodyMd]}>Call or Text 988. Free 24/7 confidential support for anyone in distress.</Text>
              <Text style={[styles.dirContact, Typography.labelMd]}>Dial: 988</Text>
            </View>

            <View style={styles.directoryCard}>
              <Text style={[styles.dirTitle, Typography.labelMd]}>Crisis Text Line</Text>
              <Text style={[styles.dirDesc, Typography.bodyMd]}>Text HOME to 741741 to connect with a crisis counselor 24/7.</Text>
              <Text style={[styles.dirContact, Typography.labelMd]}>Text: HOME to 741741</Text>
            </View>

            <View style={styles.directoryCard}>
              <Text style={[styles.dirTitle, Typography.labelMd]}>International Resources</Text>
              <Text style={[styles.dirDesc, Typography.bodyMd]}>Find emergency resources in your country via Befrienders Worldwide.</Text>
              <Text style={[styles.dirContact, Typography.labelMd]}>Website: befrienders.org</Text>
            </View>
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Roundness.xl,
    padding: 4,
    marginBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Roundness.lg,
    flex: 1,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  tabTxt: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  tabTxtActive: {
    color: Colors.onSecondaryContainer,
    fontWeight: '600',
  },
  cardContent: {
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
  cardTitle: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  circleContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  timerNum: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timerTxt: {
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  groundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resetTxt: {
    color: Colors.primary,
    fontWeight: '600',
  },
  groundingList: {
    gap: Spacing.md,
  },
  groundingItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Roundness.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  groundingItemChecked: {
    borderColor: Colors.primary,
    opacity: 0.6,
  },
  groundingItemDisabled: {
    opacity: 0.3,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  numBadgeChecked: {
    backgroundColor: Colors.primaryContainer,
  },
  numBadgeTxt: {
    color: Colors.onSurfaceVariant,
  },
  groundingText: {
    flex: 1,
  },
  groundingLabel: {
    color: Colors.onSurface,
  },
  groundingDesc: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.8,
  },
  distortionList: {
    gap: Spacing.md,
  },
  distortionItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Roundness.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  distortionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  distortionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distortionName: {
    color: Colors.onSurface,
  },
  distortionBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
    gap: Spacing.xs,
  },
  distBodyLabel: {
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
  },
  distBodyTxt: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  italic: {
    fontStyle: 'italic',
    color: Colors.onSurface,
  },
  distReframeCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.default,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  reframeCardTitle: {
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  reframeCardTxt: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  directoryList: {
    gap: Spacing.md,
  },
  directoryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Roundness.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  dirTitle: {
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  dirDesc: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
    opacity: 0.8,
  },
  dirContact: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
});
