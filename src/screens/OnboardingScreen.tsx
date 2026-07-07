import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Animated, Image, useWindowDimensions } from 'react-native';
import { Colors, Typography, Spacing, Roundness, Shadows } from '../theme';
import { Storage } from '../storage';
import { Heart, Compass, ShieldCheck, ArrowRight, Wind } from 'lucide-react-native';

interface OnboardingScreenProps {
  onComplete: (username: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Mood checks for Step 2
  const [anxiety, setAnxiety] = useState(50);
  const [clarity, setClarity] = useState(50);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNextStep = () => {
    if (step === 1 && !name.trim()) return; // Require name
    
    // Animate transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setStep(prev => prev + 1);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleFinish = async () => {
    // Save onboarding details to profile
    await Storage.saveProfile({
      username: name.trim() || 'Guest',
      apiKey: apiKey.trim(),
      onboarded: true,
    });

    // Save initial mood check-in to logs
    await Storage.saveMoodLogs([{
      clarity,
      anxiety,
      hopefulness: 50,
      bodySensations: ['Chest'],
      note: 'Initial onboarding sanctuary check-in.',
      timestamp: new Date().toISOString()
    }]);

    onComplete(name.trim() || 'Guest');
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.contentCard, 
          Shadows.soft, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            maxWidth: width > 500 ? 460 : '100%',
          }
        ]}
      >
        {/* Step 1: Welcome & Name */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJVBZ6IQ5mrDNTHbJTC503MlMhDQ8YMeRq6Ok-KokINI-MGHUQ7VQM7Q5fj1JJi0MBlj7kh1Uy_ld0fmBuXad3IiveM2B2JxCb7haK5-GdNrCLftLsJ4zIxiEhsW9hm4uK8dzJvUxcWqOQuF3cnSAzOgLeQEgQtgwPEZiIO_CzmOpIGcuTVT-52qGlu-I_dYaeFB6MpfM628Df2ZVa7OBwuFAMwZ2QKmZVK3WXCDxKZSMKFZEOTrQ' }} 
              style={styles.logoImage} 
            />
            <Text style={[styles.title, Typography.displayLg]}>Digital Sanctuary</Text>
            <Text style={[styles.desc, Typography.bodyLg]}>
              A therapeutic second brain for your mind. Organize decision parameters, balance forces, track emotional cycles, and access CBT-inspired grounding.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, Typography.labelMd]}>What should we call you?</Text>
              <TextInput
                style={[styles.input, Typography.bodyMd]}
                placeholder="Your name..."
                placeholderTextColor={Colors.outline}
                value={name}
                onChangeText={setName}
                maxLength={20}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btn, !name.trim() && styles.btnDisabled]} 
              onPress={handleNextStep}
              disabled={!name.trim()}
            >
              <Text style={[styles.btnTxt, Typography.labelMd]}>Let's Begin</Text>
              <ArrowRight size={16} color={Colors.onPrimary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Initial Mood Assessment */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Compass size={40} color={Colors.primary} style={{ marginBottom: Spacing.md }} />
            <Text style={[styles.title, Typography.headlineLg]}>Check in with your body</Text>
            <Text style={[styles.desc, Typography.bodyMd]}>
              How is your mind feeling in this exact moment? We customize color temperatures and supportive copy based on your stress level.
            </Text>

            {/* Anxiety Slider */}
            <View style={styles.sliderGroup}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderLabel, Typography.labelMd]}>Anxiety Level</Text>
                <Text style={[styles.sliderValue, Typography.labelSm]}>
                  {anxiety > 70 ? 'Overwhelming' : anxiety > 45 ? 'Moderate' : 'Calm'}
                </Text>
              </View>
              <View style={styles.scaleTrack}>
                {[10, 30, 50, 70, 90].map(pt => (
                  <TouchableOpacity
                    key={pt}
                    style={[styles.scaleNode, Math.abs(anxiety - pt) <= 10 && { borderColor: Colors.anxiety, borderWidth: 3 }]}
                    onPress={() => setAnxiety(pt)}
                  />
                ))}
              </View>
            </View>

            {/* Clarity Slider */}
            <View style={styles.sliderGroup}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderLabel, Typography.labelMd]}>Clarity Level</Text>
                <Text style={[styles.sliderValue, Typography.labelSm]}>
                  {clarity > 70 ? 'Clear & Certain' : clarity > 45 ? 'Uncertain' : 'Confused'}
                </Text>
              </View>
              <View style={styles.scaleTrack}>
                {[10, 30, 50, 70, 90].map(pt => (
                  <TouchableOpacity
                    key={pt}
                    style={[styles.scaleNode, Math.abs(clarity - pt) <= 10 && { borderColor: Colors.clarity, borderWidth: 3 }]}
                    onPress={() => setClarity(pt)}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleNextStep}>
              <Text style={[styles.btnTxt, Typography.labelMd]}>Continue Check-in</Text>
              <ArrowRight size={16} color={Colors.onPrimary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: API Key & Privacy */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <ShieldCheck size={40} color={Colors.secondary} style={{ marginBottom: Spacing.md }} />
            <Text style={[styles.title, Typography.headlineLg]}>Empower Second Brain</Text>
            <Text style={[styles.desc, Typography.bodyMd]}>
              Sanctuary operates local-first. To connect the conversational dialogue and reflection engine, provide your OpenAI API key. If left blank, we fallback to a smart offline helper.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, Typography.labelMd]}>OpenAI API Key (sk-...)</Text>
              <TextInput
                style={[styles.input, Typography.bodyMd]}
                placeholder="sk-..."
                placeholderTextColor={Colors.outline}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleNextStep}>
              <Text style={[styles.btnTxt, Typography.labelMd]}>Set Credentials</Text>
              <ArrowRight size={16} color={Colors.onPrimary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Centering Breath */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Wind size={40} color={Colors.primary} style={{ marginBottom: Spacing.md }} />
            <Text style={[styles.title, Typography.headlineLg]}>A Moment to Center</Text>
            <Text style={[styles.desc, Typography.bodyMd]}>
              Before entering your digital sanctuary, take a single deep breath to slow your mind.
            </Text>

            <View style={styles.breathMockContainer}>
              <View style={styles.breathMockCircle}>
                <Text style={[styles.breathMockTxt, Typography.labelMd]}>Breathe In</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleFinish}>
              <Text style={[styles.btnTxt, Typography.labelMd]}>Enter Sanctuary</Text>
              <Heart size={16} color={Colors.onPrimary} fill={Colors.onPrimary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Progress indicators */}
        <View style={styles.indicatorRow}>
          {[1, 2, 3, 4].map(idx => (
            <View 
              key={idx} 
              style={[
                styles.indicatorDot, 
                step === idx && styles.indicatorDotActive,
                step > idx && styles.indicatorDotDone,
              ]} 
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.marginMobile,
  },
  contentCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
  },
  stepContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.md,
    resizeMode: 'cover',
  },
  title: {
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  desc: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    width: '100%',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.onSurface,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Roundness.default,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
  },
  btn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Roundness.xl,
    width: '100%',
    marginTop: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTxt: {
    color: Colors.onPrimary,
  },
  sliderGroup: {
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    color: Colors.onSurface,
  },
  sliderValue: {
    color: Colors.onSurfaceVariant,
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Roundness.full,
  },
  scaleTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    height: 8,
    borderRadius: Roundness.full,
    marginVertical: Spacing.sm,
    paddingHorizontal: 6,
  },
  scaleNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.outlineVariant,
    borderWidth: 1,
  },
  breathMockContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  breathMockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(82, 96, 72, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathMockTxt: {
    color: Colors.primary,
    fontWeight: '600',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  indicatorDotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  indicatorDotDone: {
    backgroundColor: Colors.secondary,
  },
});
