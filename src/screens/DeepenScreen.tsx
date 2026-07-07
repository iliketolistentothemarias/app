import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Colors, Typography, Spacing, Roundness, Shadows } from '../theme';
import { Storage, Decision } from '../storage';
import { OpenAIHelper } from '../openai';
import { Plus, Brain, Sparkles, CheckCircle2, RotateCcw, X, Send, ArrowUpRight } from 'lucide-react-native';

interface DeepenScreenProps {
  onNavigate: (tab: string, params?: any) => void;
  routeParams?: { decisionId?: string };
}

interface ChatMsg {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function DeepenScreen({ onNavigate, routeParams }: DeepenScreenProps) {
  const [apiKey, setApiKey] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);

  // Form states for creating a new decision
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Career');

  // Interactive editing states
  const [editingIndex, setEditingIndex] = useState<{ isPro: boolean; index: number } | null>(null);
  const [editingText, setEditingText] = useState('');

  // AI loading and drawer states
  const [deepeningIndex, setDeepeningIndex] = useState<{ isPro: boolean; index: number } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [overallInsight, setOverallInsight] = useState('');

  // Chatbot Dialogue states
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const categories = ['Career', 'Relocation', 'Health', 'Finance', 'Personal', 'Other'];
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSettingsAndDecision();
  }, [routeParams?.decisionId]);

  const loadSettingsAndDecision = async () => {
    const profile = await Storage.getProfile();
    setApiKey(profile.apiKey);

    const decisions = await Storage.getDecisions();
    if (routeParams?.decisionId) {
      const existing = decisions.find((d) => d.id === routeParams.decisionId);
      if (existing) {
        setDecision(existing);
        setOverallInsight(existing.aiInsights[existing.aiInsights.length - 1] || '');
        setChatHistory(existing.chatHistory || []);
        return;
      }
    }

    const active = decisions.filter((d) => d.status !== 'Completed');
    if (active.length > 0 && !routeParams?.decisionId) {
      setDecision(active[0]);
      setOverallInsight(active[0].aiInsights[active[0].aiInsights.length - 1] || '');
      setChatHistory(active[0].chatHistory || []);
    } else {
      setDecision(null);
      setOverallInsight('');
      setChatHistory([]);
    }
  };

  const handleCreateDecision = async () => {
    if (!newTitle.trim()) return;

    const initialWelcome: ChatMsg = {
      sender: 'assistant',
      text: `Hello! I am your Second Brain. I see we are exploring your dilemma: "${newTitle.trim()}". Let's start mapping out your forces and friction points. What is the primary factor pulling you in either direction?`,
      timestamp: new Date().toISOString(),
    };

    const newDecision: Decision = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'In Progress',
      category: newCategory,
      pros: [],
      cons: [],
      aiInsights: [],
      initialMood: { clarity: 50, anxiety: 50, hopefulness: 50 },
      createdAt: new Date().toISOString(),
      chatHistory: [initialWelcome],
    };

    const decisions = await Storage.getDecisions();
    const updated = [newDecision, ...decisions];
    await Storage.saveDecisions(updated);

    setDecision(newDecision);
    setChatHistory([initialWelcome]);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Career');
  };

  const handleAddPerspectiveSlot = async (isPro: boolean) => {
    if (!decision) return;

    const updatedDecision = { ...decision };
    const list = isPro ? updatedDecision.pros : updatedDecision.cons;
    list.push({ text: '' });
    
    const newIndex = list.length - 1;
    await saveAndSetDecision(updatedDecision);

    setEditingIndex({ isPro, index: newIndex });
    setEditingText('');
  };

  const handleSavePerspectiveText = async (index: number, isPro: boolean) => {
    if (!decision) return;

    const updatedDecision = { ...decision };
    const list = isPro ? updatedDecision.pros : updatedDecision.cons;

    if (!editingText.trim()) {
      list.splice(index, 1);
    } else {
      list[index] = { ...list[index], text: editingText.trim() };
    }

    setEditingIndex(null);
    setEditingText('');
    await saveAndSetDecision(updatedDecision);
  };

  const handleRemoveItem = async (index: number, isPro: boolean) => {
    if (!decision) return;
    const updatedDecision = { ...decision };
    if (isPro) {
      updatedDecision.pros.splice(index, 1);
    } else {
      updatedDecision.cons.splice(index, 1);
    }
    await saveAndSetDecision(updatedDecision);
  };

  const handleDeepen = async (index: number, isPro: boolean) => {
    if (!decision) return;
    setDeepeningIndex({ isPro, index });

    const item = isPro ? decision.pros[index] : decision.cons[index];
    const response = await OpenAIHelper.deepenThought(apiKey, decision, item.text, isPro);

    const updatedDecision = { ...decision };
    if (isPro) {
      updatedDecision.pros[index].deepened = response;
    } else {
      updatedDecision.cons[index].deepened = response;
    }

    setDeepeningIndex(null);
    await saveAndSetDecision(updatedDecision);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !decision) return;

    const userMsg: ChatMsg = {
      sender: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatInput('');
    setChatLoading(true);

    // Scroll to bottom
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    const allDecisions = await Storage.getDecisions();
    const allMoods = await Storage.getMoodLogs();

    const response = await OpenAIHelper.sendChat(
      apiKey,
      decision,
      chatHistory,
      userMsg.text,
      allDecisions,
      allMoods
    );

    const assistantMsg: ChatMsg = {
      sender: 'assistant',
      text: response,
      timestamp: new Date().toISOString(),
    };

    const finalHistory = [...updatedHistory, assistantMsg];
    setChatHistory(finalHistory);
    setChatLoading(false);

    // Save history to storage
    const updatedDecision = { ...decision, chatHistory: finalHistory };
    await saveAndSetDecision(updatedDecision);

    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleAddSuggestedTag = async (text: string, isPro: boolean) => {
    if (!decision) return;
    const updatedDecision = { ...decision };
    const list = isPro ? updatedDecision.pros : updatedDecision.cons;
    list.push({ text });
    await saveAndSetDecision(updatedDecision);
  };

  const handleCompleteDecision = async () => {
    if (!decision) return;
    const updatedDecision: Decision = {
      ...decision,
      status: 'Completed',
      outcome: 'Decision completed and archived.',
      completedAt: new Date().toISOString(),
    };

    const decisions = await Storage.getDecisions();
    const updatedList = decisions.map((d) => (d.id === decision.id ? updatedDecision : d));
    await Storage.saveDecisions(updatedList);

    onNavigate('progress');
  };

  const saveAndSetDecision = async (updated: Decision) => {
    setDecision(updated);
    const decisions = await Storage.getDecisions();
    const updatedList = decisions.map((d) => (d.id === updated.id ? updated : d));
    await Storage.saveDecisions(updatedList);
  };

  const handleResetWorkspace = () => {
    setDecision(null);
    setOverallInsight('');
    setChatHistory([]);
  };

  // Helper to extract suggestions out of response text
  const parseResponseSuggestions = (text: string) => {
    const pros: string[] = [];
    const cons: string[] = [];
    
    const proRegex = /\[PRO:\s*([^\]]+)\]/gi;
    let match;
    while ((match = proRegex.exec(text)) !== null) {
      pros.push(match[1].trim());
    }

    const conRegex = /\[CON:\s*([^\]]+)\]/gi;
    while ((match = conRegex.exec(text)) !== null) {
      cons.push(match[1].trim());
    }

    const cleanText = text
      .replace(/\[PRO:\s*([^\]]+)\]/gi, '')
      .replace(/\[CON:\s*([^\]]+)\]/gi, '')
      .trim();

    return { cleanText, pros, cons };
  };

  if (!decision) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, Typography.headlineLg]}>Frame Your Dilemma</Text>
          <Text style={[styles.subtitle, Typography.bodyLg]}>
            Give your decision a name and describe it gently.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={[styles.inputLabel, Typography.labelMd]}>What decision are you weighing right now?</Text>
          <TextInput
            style={[styles.input, Typography.bodyMd]}
            placeholder="e.g. Relocating closer to nature"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholderTextColor={Colors.outline}
          />

          <Text style={[styles.inputLabel, Typography.labelMd]}>Provide some context (optional)</Text>
          <TextInput
            style={[styles.textArea, Typography.bodyMd]}
            placeholder="Describe the dilemma gently. What are the key factors? how do you feel..."
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.outline}
          />

          <Text style={[styles.inputLabel, Typography.labelMd]}>Category</Text>
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  newCategory === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setNewCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    Typography.labelSm,
                    newCategory === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateDecision}>
            <Text style={[styles.createButtonText, Typography.labelMd]}>Begin Reflections</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Title & Dilemma Frame */}
      <View style={styles.workspaceHeader}>
        <View style={styles.workspaceMeta}>
          <Text style={[styles.categoryBadge, Typography.labelSm]}>{decision.category}</Text>
          <TouchableOpacity onPress={handleResetWorkspace} style={styles.resetWorkspaceBtn}>
            <RotateCcw size={14} color={Colors.onSurfaceVariant} />
            <Text style={[styles.resetWorkspaceTxt, Typography.labelSm]}>New Workspace</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.workspaceTitle, Typography.headlineLg]}>{decision.title}</Text>
        {decision.description ? (
          <Text style={[styles.workspaceDesc, Typography.bodyMd]}>{decision.description}</Text>
        ) : null}
      </View>

      {/* Balance Scale Matrix */}
      <View style={styles.scaleContainer}>
        <Text style={[styles.sectionTitle, Typography.headlineMd]}>Balance Scale</Text>

        <View style={styles.matrixGrid}>
          {/* Pros Column (Uplifting Forces) */}
          <View style={styles.matrixColumn}>
            <View style={[styles.columnHeader, { backgroundColor: 'rgba(82, 96, 72, 0.08)' }]}>
              <Text style={[styles.columnTitle, Typography.labelMd, { color: Colors.primary }]}>Uplifting Forces</Text>
            </View>

            <View style={styles.itemsList}>
              {decision.pros.map((pro, index) => {
                const isEditing = editingIndex?.isPro === true && editingIndex?.index === index;
                
                return (
                  <View key={index} style={[styles.itemCard, Shadows.ambient]}>
                    <View style={styles.cardTopRow}>
                      {isEditing ? (
                        <TextInput
                          style={[styles.cardTextInput, Typography.bodyMd]}
                          placeholder="A supportive thought..."
                          placeholderTextColor={Colors.outline}
                          value={editingText}
                          onChangeText={setEditingText}
                          autoFocus
                          onBlur={() => handleSavePerspectiveText(index, true)}
                          onSubmitEditing={() => handleSavePerspectiveText(index, true)}
                        />
                      ) : (
                        <TouchableOpacity 
                          style={{ flex: 1 }} 
                          onPress={() => {
                            setEditingIndex({ isPro: true, index });
                            setEditingText(pro.text);
                          }}
                        >
                          <Text style={[styles.itemText, Typography.bodyMd]}>{pro.text}</Text>
                        </TouchableOpacity>
                      )}
                      
                      {!isEditing && (
                        <TouchableOpacity onPress={() => handleRemoveItem(index, true)} style={styles.deleteBtn}>
                          <X size={14} color={Colors.outline} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {pro.deepened ? (
                      <View style={styles.deepenedBox}>
                        <View style={styles.deepenedHeader}>
                          <Sparkles size={11} color={Colors.primary} />
                          <Text style={[styles.deepenedHeaderTxt, Typography.labelSm, { color: Colors.primary }]}>Reflection</Text>
                        </View>
                        <Text style={[styles.deepenedTxt, Typography.bodyMd]}>{pro.deepened}</Text>
                      </View>
                    ) : pro.text && !isEditing ? (
                      <TouchableOpacity
                        style={styles.deepenBtn}
                        onPress={() => handleDeepen(index, true)}
                        disabled={deepeningIndex !== null}
                      >
                        {deepeningIndex?.isPro && deepeningIndex?.index === index ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <>
                            <Brain size={13} color={Colors.primary} style={{ marginRight: 4 }} />
                            <Text style={[styles.deepenBtnTxt, Typography.labelSm, { color: Colors.primary }]}>Deepen</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              {/* Add Perspective Dashed Button */}
              {editingIndex?.isPro !== true && (
                <TouchableOpacity 
                  style={styles.addPerspectiveBtn} 
                  onPress={() => handleAddPerspectiveSlot(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={Colors.outline} />
                  <Text style={[styles.addPerspectiveTxt, Typography.labelSm]}>Add Perspective</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cons Column (Friction Points) */}
          <View style={styles.matrixColumn}>
            <View style={[styles.columnHeader, { backgroundColor: 'rgba(117, 85, 71, 0.08)' }]}>
              <Text style={[styles.columnTitle, Typography.labelMd, { color: Colors.tertiary }]}>Friction Points</Text>
            </View>

            <View style={styles.itemsList}>
              {decision.cons.map((con, index) => {
                const isEditing = editingIndex?.isPro === false && editingIndex?.index === index;

                return (
                  <View key={index} style={[styles.itemCard, Shadows.ambient]}>
                    <View style={styles.cardTopRow}>
                      {isEditing ? (
                        <TextInput
                          style={[styles.cardTextInput, Typography.bodyMd]}
                          placeholder="A point of hesitation..."
                          placeholderTextColor={Colors.outline}
                          value={editingText}
                          onChangeText={setEditingText}
                          autoFocus
                          onBlur={() => handleSavePerspectiveText(index, false)}
                          onSubmitEditing={() => handleSavePerspectiveText(index, false)}
                        />
                      ) : (
                        <TouchableOpacity 
                          style={{ flex: 1 }} 
                          onPress={() => {
                            setEditingIndex({ isPro: false, index });
                            setEditingText(con.text);
                          }}
                        >
                          <Text style={[styles.itemText, Typography.bodyMd]}>{con.text}</Text>
                        </TouchableOpacity>
                      )}

                      {!isEditing && (
                        <TouchableOpacity onPress={() => handleRemoveItem(index, false)} style={styles.deleteBtn}>
                          <X size={14} color={Colors.outline} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {con.deepened ? (
                      <View style={[styles.deepenedBox, { borderLeftColor: Colors.tertiary }]}>
                        <View style={styles.deepenedHeader}>
                          <Sparkles size={11} color={Colors.tertiary} />
                          <Text style={[styles.deepenedHeaderTxt, Typography.labelSm, { color: Colors.tertiary }]}>Reframing</Text>
                        </View>
                        <Text style={[styles.deepenedTxt, Typography.bodyMd]}>{con.deepened}</Text>
                      </View>
                    ) : con.text && !isEditing ? (
                      <TouchableOpacity
                        style={styles.deepenBtn}
                        onPress={() => handleDeepen(index, false)}
                        disabled={deepeningIndex !== null}
                      >
                        {deepeningIndex?.isPro === false && deepeningIndex?.index === index ? (
                          <ActivityIndicator size="small" color={Colors.tertiary} />
                        ) : (
                          <>
                            <Brain size={13} color={Colors.tertiary} style={{ marginRight: 4 }} />
                            <Text style={[styles.deepenBtnTxt, Typography.labelSm, { color: Colors.tertiary }]}>Deepen</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              {/* Add Perspective Dashed Button */}
              {editingIndex?.isPro !== false && (
                <TouchableOpacity 
                  style={styles.addPerspectiveBtn} 
                  onPress={() => handleAddPerspectiveSlot(false)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={Colors.outline} />
                  <Text style={[styles.addPerspectiveTxt, Typography.labelSm]}>Add Perspective</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* SECOND BRAIN CHAT DIALOGUE */}
      <View style={styles.chatSection}>
        <View style={styles.chatHeader}>
          <Brain size={20} color={Colors.primary} />
          <Text style={[styles.chatTitle, Typography.headlineMd]}>Second Brain Dialogue</Text>
        </View>
        <Text style={[styles.chatSubtitle, Typography.bodyMd]}>
          Discuss this decision continuously. The AI remembers your history, checks your current mood flow, and suggests options.
        </Text>

        {/* Scrollable conversation history */}
        <ScrollView
          ref={chatScrollRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatHistoryList}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {chatHistory.map((m, index) => {
            const parsed = parseResponseSuggestions(m.text);
            const isUser = m.sender === 'user';
            
            return (
              <View 
                key={index} 
                style={[
                  styles.msgWrapper,
                  isUser ? styles.msgWrapperUser : styles.msgWrapperAI
                ]}
              >
                <View 
                  style={[
                    styles.msgBubble,
                    isUser ? styles.msgBubbleUser : styles.msgBubbleAI
                  ]}
                >
                  <Text style={[styles.msgText, Typography.bodyMd, isUser && { color: Colors.onPrimary }]}>
                    {parsed.cleanText}
                  </Text>
                </View>

                {/* Suggested Action Chips */}
                {!isUser && (parsed.pros.length > 0 || parsed.cons.length > 0) && (
                  <View style={styles.chipsContainer}>
                    {parsed.pros.map((txt) => (
                      <TouchableOpacity
                        key={txt}
                        style={[styles.suggestChip, { backgroundColor: 'rgba(82, 96, 72, 0.15)' }]}
                        onPress={() => handleAddSuggestedTag(txt, true)}
                      >
                        <Text style={[styles.suggestChipTxt, Typography.labelSm, { color: Colors.primary }]}>
                          + Force: "{txt}"
                        </Text>
                        <ArrowUpRight size={10} color={Colors.primary} style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    ))}
                    {parsed.cons.map((txt) => (
                      <TouchableOpacity
                        key={txt}
                        style={[styles.suggestChip, { backgroundColor: 'rgba(117, 85, 71, 0.15)' }]}
                        onPress={() => handleAddSuggestedTag(txt, false)}
                      >
                        <Text style={[styles.suggestChipTxt, Typography.labelSm, { color: Colors.tertiary }]}>
                          + Friction: "{txt}"
                        </Text>
                        <ArrowUpRight size={10} color={Colors.tertiary} style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {chatLoading && (
            <View style={styles.msgWrapperAI}>
              <View style={[styles.msgBubble, styles.msgBubbleAI, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.chatInputRow}>
          <TextInput
            style={[styles.chatTextInput, Typography.bodyMd]}
            placeholder="Type a thought or ask what factors you missed..."
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSendChatMessage}
            placeholderTextColor={Colors.outline}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]} 
            onPress={handleSendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
          >
            <Send size={16} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Archive Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={handleCompleteDecision}
          activeOpacity={0.8}
        >
          <CheckCircle2 size={20} color={Colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.completeBtnTxt, Typography.labelMd]}>Save & Close Decision</Text>
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
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    color: Colors.onSurface,
    marginBottom: -4,
  },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Roundness.default,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
    borderWidth: 0,
  },
  textArea: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Roundness.default,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
    textAlignVertical: 'top',
    height: 120,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  categoryChip: {
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Roundness.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primaryContainer,
    borderColor: 'transparent',
  },
  categoryChipText: {
    color: Colors.onSurfaceVariant,
  },
  categoryChipTextSelected: {
    color: Colors.onPrimaryContainer,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: Roundness.default,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  createButtonText: {
    color: Colors.onPrimary,
  },
  workspaceHeader: {
    marginBottom: Spacing.lg,
  },
  workspaceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: Colors.secondaryContainer,
    color: Colors.onSecondaryContainer,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Roundness.full,
    alignSelf: 'flex-start',
  },
  resetWorkspaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  resetWorkspaceTxt: {
    color: Colors.onSurfaceVariant,
    marginLeft: 4,
  },
  workspaceTitle: {
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  workspaceDesc: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
  },
  scaleContainer: {
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  matrixGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  matrixColumn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.4)',
  },
  columnHeader: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  columnTitle: {
    fontWeight: '600',
  },
  itemsList: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  itemCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Roundness.default,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  cardTextInput: {
    flex: 1,
    color: Colors.onSurface,
    padding: 0,
    margin: 0,
    borderWidth: 0,
  },
  itemText: {
    color: Colors.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 2,
  },
  deepenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: Spacing.sm,
  },
  deepenBtnTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  deepenedBox: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.xs,
    borderRadius: Roundness.sm,
  },
  deepenedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  deepenedHeaderTxt: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  deepenedTxt: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  addPerspectiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
    borderRadius: Roundness.default,
    gap: Spacing.xs,
    backgroundColor: 'transparent',
    marginTop: Spacing.xs,
  },
  addPerspectiveTxt: {
    color: Colors.outline,
    fontWeight: '600',
  },
  aiDrawer: {
    backgroundColor: 'rgba(63, 72, 73, 0.05)',
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(63, 72, 73, 0.1)',
    marginVertical: Spacing.lg,
  },
  aiDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  aiDrawerTitle: {
    color: Colors.secondary,
    marginLeft: Spacing.sm,
  },
  aiDrawerText: {
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },
  aiDrawerPrompt: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiDrawerPromptTxt: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.8,
  },
  generateBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Roundness.default,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  generateBtnTxt: {
    color: Colors.onSecondary,
  },
  regenerateBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  regenerateTxt: {
    color: Colors.primary,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
  completeBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Roundness.xl,
  },
  completeBtnTxt: {
    color: Colors.onPrimary,
  },
  chatSection: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Roundness.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.5)',
    marginVertical: Spacing.lg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  chatTitle: {
    color: Colors.primary,
  },
  chatSubtitle: {
    color: Colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: Spacing.lg,
    fontSize: 14,
    lineHeight: 20,
  },
  chatContainer: {
    height: 320,
    backgroundColor: Colors.surface,
    borderRadius: Roundness.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  chatHistoryList: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  msgWrapper: {
    width: '100%',
    marginVertical: Spacing.xs,
  },
  msgWrapperUser: {
    alignItems: 'flex-end',
  },
  msgWrapperAI: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: Spacing.md,
    borderRadius: Roundness.lg,
  },
  msgBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleAI: {
    backgroundColor: Colors.surfaceContainer,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  typingBubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.onSurface,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Roundness.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  suggestChipTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Roundness.default,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
