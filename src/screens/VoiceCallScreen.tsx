import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Roundness, Shadows } from '../theme';
import { Storage, Decision } from '../storage';
import { OpenAIHelper } from '../openai';
import { Audio } from 'expo-av';
import { Mic, MicOff, PhoneOff, Volume2, Sparkles, AlertCircle } from 'lucide-react-native';

interface VoiceCallScreenProps {
  onNavigate: (tab: string, params?: any) => void;
}

export default function VoiceCallScreen({ onNavigate }: VoiceCallScreenProps) {
  const [apiKey, setApiKey] = useState('');
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);

  // Audio recording & playback states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [callStatus, setCallStatus] = useState<'Connecting' | 'Connected' | 'Listening' | 'Thinking' | 'Speaking'>('Connecting');
  
  // Dialog logs
  const [transcript, setTranscript] = useState<string[]>([]);
  const [aiReplies, setAiReplies] = useState<string[]>([]);
  
  // Timers and animations
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveAnim = useRef(new Animated.Value(1)).current;

  // Permissions
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    loadSettings();
    requestMicrophonePermission();
    
    // Start pulse animation loop
    startPulse();

    // Call duration timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupSound();
      cleanupRecording();
    };
  }, []);

  const loadSettings = async () => {
    const profile = await Storage.getProfile();
    setApiKey(profile.apiKey);

    const decisions = await Storage.getDecisions();
    const active = decisions.filter((d) => d.status !== 'Completed');
    if (active.length > 0) {
      setActiveDecision(active[0]);
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        shouldRouteThroughEarpieceOnIOS: false,
      });
    } catch (e) {
      console.log('Error setting audio mode:', e);
    }

    setCallStatus('Connected');

    // Auto-welcome voice prompt
    setTimeout(async () => {
      const welcomeText = active 
        ? `Hello! I am here. I see we are reflecting on your decision: ${active.title}. Tell me, what is on your mind today?`
        : `Hello! I am your second brain. How can I help you center your thoughts today?`;
      
      setTranscript((prev) => [...prev, `feelAI: ${welcomeText}`]);
      setCallStatus('Speaking');
      setIsPlaying(true);
      
      const soundBase64 = await OpenAIHelper.generateSpeech(profile.apiKey, welcomeText);
      if (soundBase64) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: soundBase64 },
          { shouldPlay: true }
        );
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setCallStatus('Connected');
            setIsPlaying(false);
          }
        });
      } else {
        setCallStatus('Connected');
        setIsPlaying(false);
      }
    }, 1000);
  };

  const requestMicrophonePermission = async () => {
    if (permissionResponse?.status !== 'granted') {
      await requestPermission();
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const cleanupSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (e) {
        console.log('Error unloading sound:', e);
      }
    }
  };

  const cleanupRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {
        console.log('Error stopping recording:', e);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Voice Interaction Logic
  const startRecordingVoice = async () => {
    try {
      await cleanupSound();
      setIsPlaying(false);

      if (permissionResponse?.status !== 'granted') {
        const resp = await requestPermission();
        if (resp.status !== 'granted') return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        shouldRouteThroughEarpieceOnIOS: false,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setCallStatus('Listening');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingVoice = async () => {
    if (!recording) return;

    try {
      setCallStatus('Thinking');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Transcribe voice
        const spokenText = await OpenAIHelper.transcribeAudio(apiKey, uri);
        if (!spokenText.trim() || spokenText.includes("couldn't hear you clearly")) {
          setCallStatus('Connected');
          return;
        }

        setTranscript((prev) => [...prev, `You: ${spokenText}`]);

        // Send to Second Brain Chat
        const decisions = await Storage.getDecisions();
        const moods = await Storage.getMoodLogs();
        const active = activeDecision || (decisions.length > 0 ? decisions[0] : null);

        if (!active) {
          setCallStatus('Connected');
          return;
        }

        const reply = await OpenAIHelper.sendChat(
          apiKey,
          active,
          [],
          spokenText,
          decisions,
          moods
        );

        // Remove tag matches from TTS voice text
        const voiceText = reply.replace(/\[(PRO|CON):[^\]]+\]/gi, '').trim();
        setTranscript((prev) => [...prev, `feelAI: ${voiceText}`]);

        // Synthesize response audio
        const soundBase64 = await OpenAIHelper.generateSpeech(apiKey, voiceText);
        if (soundBase64) {
          setCallStatus('Speaking');
          setIsPlaying(true);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: soundBase64 },
            { shouldPlay: true }
          );
          setSound(newSound);

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setCallStatus('Connected');
              setIsPlaying(false);
            }
          });
        } else {
          // If no API key / fallback offline response
          setCallStatus('Connected');
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setCallStatus('Connected');
    }
  };

  return (
    <View style={styles.container}>
      {/* Call Header */}
      <View style={styles.header}>
        <Text style={[styles.brandName, Typography.labelMd]}>feelAI Voice Session</Text>
        <Text style={[styles.timer, Typography.headlineLg]}>{formatTime(duration)}</Text>
        <Text style={[styles.statusTxt, Typography.bodyMd, { color: Colors.primary }]}>
          {callStatus === 'Connecting' ? 'Establishing session...' :
           callStatus === 'Connected' ? 'Waiting to listen' :
           callStatus === 'Listening' ? 'Listening to your thoughts...' :
           callStatus === 'Thinking' ? 'Reflecting...' : 'Speaking...'}
        </Text>
      </View>

      {/* Voice Animation Area */}
      <View style={styles.visualizerContainer}>
        <Animated.View 
          style={[
            styles.pulseWave, 
            { 
              transform: [{ scale: waveAnim }],
              backgroundColor: 
                callStatus === 'Listening' ? 'rgba(117, 85, 71, 0.12)' :
                callStatus === 'Thinking' ? 'rgba(82, 96, 72, 0.12)' :
                'rgba(82, 96, 72, 0.06)'
            }
          ]} 
        />
        <View style={[styles.centralBubble, Shadows.ambient]}>
          <Volume2 size={40} color={Colors.primary} />
        </View>
      </View>

      {/* Active Context Card */}
      {activeDecision ? (
        <View style={styles.contextCard}>
          <Text style={[styles.contextLabel, Typography.labelSm]}>Current Focus</Text>
          <Text style={[styles.contextTitle, Typography.labelMd]} numberOfLines={1}>{activeDecision.title}</Text>
        </View>
      ) : null}

      {/* Live Dialogue Logs */}
      <View style={styles.transcriptSection}>
        <Text style={[styles.sectionTitle, Typography.labelMd]}>Live Transcript</Text>
        <ScrollView 
          style={styles.transcriptScroll} 
          contentContainerStyle={styles.transcriptList}
          showsVerticalScrollIndicator={false}
        >
          {transcript.length === 0 ? (
            <Text style={[styles.placeholderTxt, Typography.bodyMd]}>
              Hold the microphone button below and express your thoughts. The Second Brain counselor will respond back vocally.
            </Text>
          ) : (
            transcript.map((line, idx) => (
              <Text 
                key={idx} 
                style={[
                  styles.transcriptLine, 
                  Typography.bodyMd,
                  line.startsWith('You:') ? { color: Colors.onSurface } : { color: Colors.primary, fontWeight: '500' }
                ]}
              >
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      {/* API Key Alert warning */}
      {!apiKey && (
        <View style={styles.alertBar}>
          <AlertCircle size={16} color={Colors.tertiary} />
          <Text style={[styles.alertTxt, Typography.labelSm]}>
            Mock fallback active. Provide an API key in settings to hear voice.
          </Text>
        </View>
      )}

      {/* Control Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[
            styles.micBtn, 
            callStatus === 'Listening' && styles.micBtnActive
          ]}
          onPressIn={startRecordingVoice}
          onPressOut={stopRecordingVoice}
          activeOpacity={0.8}
        >
          <Mic size={24} color={callStatus === 'Listening' ? Colors.onPrimary : Colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.endBtn} 
          onPress={() => onNavigate('reflect')}
        >
          <PhoneOff size={24} color={Colors.onPrimary} fill={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.footerHint, Typography.labelSm]}>
        Press and hold the microphone to talk. Release to send.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  brandName: {
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  timer: {
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statusTxt: {
    fontWeight: '600',
  },
  visualizerContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.lg,
  },
  pulseWave: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
  },
  centralBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
  },
  contextCard: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Roundness.lg,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  contextLabel: {
    color: Colors.outline,
    marginBottom: 2,
  },
  contextTitle: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
  transcriptSection: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.4)',
    maxHeight: 180,
  },
  sectionTitle: {
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptList: {
    gap: Spacing.xs,
  },
  placeholderTxt: {
    color: Colors.outline,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  transcriptLine: {
    lineHeight: 20,
  },
  alertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(117, 85, 71, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Roundness.default,
    alignSelf: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  alertTxt: {
    color: Colors.tertiary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  micBtnActive: {
    backgroundColor: Colors.tertiary,
    borderColor: 'transparent',
  },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.anxiety,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerHint: {
    textAlign: 'center',
    color: Colors.outline,
  },
});
