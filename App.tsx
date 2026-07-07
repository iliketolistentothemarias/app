import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions, SafeAreaView, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Colors, Typography, Spacing, Roundness } from './src/theme';
import { Storage } from './src/storage';

// Screens
import ReflectScreen from './src/screens/ReflectScreen';
import DeepenScreen from './src/screens/DeepenScreen';
import JournalScreen from './src/screens/JournalScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SafeZoneScreen from './src/screens/SafeZoneScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import VoiceCallScreen from './src/screens/VoiceCallScreen';

// Icons
import { Heart, Brain, PenTool, TrendingUp, Settings, Compass, Sparkle, Phone } from 'lucide-react-native';

// Google Fonts imports
import {
  Literata_400Regular,
  Literata_500Medium,
  Literata_600SemiBold,
  Literata_700Bold,
} from '@expo-google-fonts/literata';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

export default function App() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768; // Tablet or Desktop web width

  const [activeTab, setActiveTab] = useState<string>('reflect');
  const [routeParams, setRouteParams] = useState<any>(undefined);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    Storage.getProfile().then((profile) => {
      setIsOnboarded(!!profile.onboarded);
    });
  }, []);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Literata_400Regular,
    Literata_500Medium,
    Literata_600SemiBold,
    Literata_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const handleNavigate = (tab: string, params?: any) => {
    setActiveTab(tab);
    setRouteParams(params);
  };

  if (!fontsLoaded || isOnboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
        <Text style={styles.loadingText}>Loading sanctuary...</Text>
      </View>
    );
  }

  if (!isOnboarded) {
    return (
      <OnboardingScreen
        onComplete={(username) => {
          setIsOnboarded(true);
          setActiveTab('reflect');
        }}
      />
    );
  }

  // Render active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'reflect':
        return <ReflectScreen onNavigate={handleNavigate} />;
      case 'voice':
        return <VoiceCallScreen onNavigate={handleNavigate} />;
      case 'deepen':
        return <DeepenScreen onNavigate={handleNavigate} routeParams={routeParams} />;
      case 'journal':
        return <JournalScreen onNavigate={handleNavigate} />;
      case 'progress':
        return <ProgressScreen onNavigate={handleNavigate} />;
      case 'safezone':
        return <SafeZoneScreen />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      default:
        return <ReflectScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <View style={[styles.mainLayout, isLargeScreen && styles.mainLayoutDesktop]}>
        
        {/* TOP APP BAR (Header) - Mobile Only */}
        {!isLargeScreen && (
          <View style={styles.mobileHeader}>
            <TouchableOpacity style={styles.avatarButton} onPress={() => setActiveTab('settings')}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByFFM8iWGEAsVP0jz42Whr1nd1sTCdhAzBG77lfSSdrkH-GP_6qJMyvvIbPWOBXxMv0cWczJTzvE7FrC0vI_gKUOg8eODCgQfTJOGHNfUGD_7BxB8GKrMFh8YUax89QTSYltQl29eucNsl3k9DR-oObvTjGEga0EMNUiSGSX1ZdMnNt6z4EjtTkEuxXcd5hGb8HoImbcxzLCNS4vyt_PAJhdC8x5wuJ4qP4NduhB2y3dY7QwrIcxA' }} 
                style={styles.avatarImage} 
              />
            </TouchableOpacity>
            
            <Text style={[styles.appTitle, Typography.headlineMd]}>Digital Sanctuary</Text>
            
            <TouchableOpacity 
              style={[styles.settingsButton, activeTab === 'settings' && styles.settingsButtonActive]}
              onPress={() => setActiveTab('settings')}
            >
              <Settings size={22} color={activeTab === 'settings' ? Colors.primary : Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        )}

        {/* SIDEBAR NAVIGATION - Tablet/Desktop Web Only */}
        {isLargeScreen && (
          <View style={styles.desktopSidebar}>
            <View style={styles.desktopBrand}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJVBZ6IQ5mrDNTHbJTC503MlMhDQ8YMeRq6Ok-KokINI-MGHUQ7VQM7Q5fj1JJi0MBlj7kh1Uy_ld0fmBuXad3IiveM2B2JxCb7haK5-GdNrCLftLsJ4zIxiEhsW9hm4uK8dzJvUxcWqOQuF3cnSAzOgLeQEgQtgwPEZiIO_CzmOpIGcuTVT-52qGlu-I_dYaeFB6MpfM628Df2ZVa7OBwuFAMwZ2QKmZVK3WXCDxKZSMKFZEOTrQ' }} 
                style={styles.desktopBrandLogo} 
              />
              <Text style={[styles.desktopBrandName, Typography.labelMd]}>Sanctuary</Text>
            </View>

            <View style={styles.desktopNavGroup}>
              <TouchableOpacity
                style={[styles.desktopNavItem, activeTab === 'reflect' && styles.desktopNavItemActive]}
                onPress={() => handleNavigate('reflect')}
              >
                <Heart size={20} color={activeTab === 'reflect' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
                <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'reflect' && styles.desktopNavTextActive]}>
                  Reflect
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavItem, activeTab === 'deepen' && styles.desktopNavItemActive]}
                onPress={() => handleNavigate('deepen')}
              >
                <Brain size={20} color={activeTab === 'deepen' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
                <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'deepen' && styles.desktopNavTextActive]}>
                  Deepen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavItem, activeTab === 'journal' && styles.desktopNavItemActive]}
                onPress={() => handleNavigate('journal')}
              >
                <PenTool size={20} color={activeTab === 'journal' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
                <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'journal' && styles.desktopNavTextActive]}>
                  Journal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavItem, activeTab === 'progress' && styles.desktopNavItemActive]}
                onPress={() => handleNavigate('progress')}
              >
                <TrendingUp size={20} color={activeTab === 'progress' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
                <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'progress' && styles.desktopNavTextActive]}>
                  Progress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavItem, activeTab === 'safezone' && styles.desktopNavItemActive]}
                onPress={() => handleNavigate('safezone')}
              >
                <Compass size={20} color={activeTab === 'safezone' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
                <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'safezone' && styles.desktopNavTextActive]}>
                  Safe Zone
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavItem, activeTab === 'voice' && styles.desktopNavItemActive]}
                onPress={() => handleNavigate('voice')}
              >
                <Phone size={20} color={activeTab === 'voice' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
                <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'voice' && styles.desktopNavTextActive]}>
                  feelAI Call
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.desktopNavItem, styles.desktopSettingsItem, activeTab === 'settings' && styles.desktopNavItemActive]}
              onPress={() => handleNavigate('settings')}
            >
              <Settings size={20} color={activeTab === 'settings' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
              <Text style={[styles.desktopNavText, Typography.labelSm, activeTab === 'settings' && styles.desktopNavTextActive]}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ACTIVE SCREEN CONTENT CONTAINER */}
        <View style={[styles.screenWrapper, !isLargeScreen && { paddingBottom: 100 }]}>
          <View style={styles.screenInner}>
            {renderScreen()}
          </View>
        </View>

        {/* BOTTOM NAVIGATION BAR - Mobile Only */}
        {!isLargeScreen && (
          <View style={styles.mobileNav}>
            <TouchableOpacity
              style={[styles.mobileNavItem, activeTab === 'reflect' && styles.mobileNavItemActive]}
              onPress={() => handleNavigate('reflect')}
            >
              <Heart size={20} color={activeTab === 'reflect' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} fill={activeTab === 'reflect' ? Colors.onSecondaryContainer : 'none'} />
              <Text style={[styles.mobileNavText, Typography.labelSm, activeTab === 'reflect' && styles.mobileNavTextActive]}>
                Reflect
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileNavItem, activeTab === 'deepen' && styles.mobileNavItemActive]}
              onPress={() => handleNavigate('deepen')}
            >
              <Brain size={20} color={activeTab === 'deepen' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
              <Text style={[styles.mobileNavText, Typography.labelSm, activeTab === 'deepen' && styles.mobileNavTextActive]}>
                Deepen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileNavItem, activeTab === 'journal' && styles.mobileNavItemActive]}
              onPress={() => handleNavigate('journal')}
            >
              <PenTool size={20} color={activeTab === 'journal' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
              <Text style={[styles.mobileNavText, Typography.labelSm, activeTab === 'journal' && styles.mobileNavTextActive]}>
                Journal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileNavItem, activeTab === 'progress' && styles.mobileNavItemActive]}
              onPress={() => handleNavigate('progress')}
            >
              <TrendingUp size={20} color={activeTab === 'progress' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
              <Text style={[styles.mobileNavText, Typography.labelSm, activeTab === 'progress' && styles.mobileNavTextActive]}>
                Progress
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileNavItem, activeTab === 'voice' && styles.mobileNavItemActive]}
              onPress={() => handleNavigate('voice')}
            >
              <Phone size={20} color={activeTab === 'voice' ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} />
              <Text style={[styles.mobileNavText, Typography.labelSm, activeTab === 'voice' && styles.mobileNavTextActive]}>
                feelAI
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: 'System', // Fallback
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Colors.background,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
  },
  mobileHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    borderBottomWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  appTitle: {
    color: Colors.primary,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 4,
  },
  settingsButtonActive: {
    opacity: 0.7,
  },
  desktopSidebar: {
    width: 200,
    borderRightWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'flex-start',
    gap: Spacing.xl,
  },
  desktopBrand: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  desktopBrandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: Spacing.xs,
    resizeMode: 'cover',
  },
  desktopBrandName: {
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  desktopNavGroup: {
    gap: Spacing.sm,
    flex: 1,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Roundness.lg,
    gap: Spacing.md,
  },
  desktopNavItemActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  desktopNavText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
  },
  desktopNavTextActive: {
    color: Colors.onSecondaryContainer,
    fontWeight: '600',
  },
  desktopSettingsItem: {
    marginTop: 'auto',
  },
  screenWrapper: {
    flex: 1,
    position: 'relative',
  },
  screenInner: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600, // Keeps reading margins comfortable on desktop
  },
  mobileNav: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 249, 245, 0.88)', // Liquid Glass translucent warm paper canvas
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.7)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
    paddingHorizontal: 8,
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 56,
  },
  mobileNavItemActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  mobileNavText: {
    color: Colors.onSurfaceVariant,
    fontSize: 9,
    marginTop: 2,
  },
  mobileNavTextActive: {
    color: Colors.onSecondaryContainer,
    fontWeight: '600',
  },
});
