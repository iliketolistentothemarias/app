import { Platform } from 'react-native';
import { Decision } from './storage';

export const OpenAIHelper = {
  /**
   * Helper to fetch OpenAI responses with fallback mock responses
   */
  async requestCompletion(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    fallbackText: string
  ): Promise<string> {
    if (!apiKey) {
      // Simulate API call delay then return fallback
      await new Promise((resolve) => setTimeout(resolve, 800));
      return fallbackText;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', errorText);
        return fallbackText + ' (Fallback: There was a connection/API error)';
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      console.error('Fetch error during OpenAI request', e);
      return fallbackText + ' (Fallback: Network offline)';
    }
  },

  /**
   * Deepens a single Pro or Con item using CBT-inspired reflections
   */
  async deepenThought(
    apiKey: string,
    decision: { title: string; description: string },
    itemText: string,
    isPro: boolean
  ): Promise<string> {
    const typeLabel = isPro ? 'Uplifting Force (Pro)' : 'Friction Point (Con)';
    
    const systemPrompt = `You are an empathetic, clinical therapeutic assistant inside 'Digital Sanctuary', a decision-making and mental health app.
Your role is to help users look deeper into their thoughts.
When given a user's decision context and a specific pro or con, offer a short, 1-2 sentence response.
- Gently notice if the thought stems from a desire for safety, social expectation, fear of uncertainty, or values alignment.
- Do NOT tell them what to do; instead, ask a gentle question or suggest a perspective that encourages self-reflection and cognitive restructuring (CBT).
Keep the tone warm, grounded, patient, and therapeutic. Keep it concise (under 50 words).`;

    const userPrompt = `Decision: "${decision.title}" (${decision.description})
Specific ${typeLabel}: "${itemText}"`;

    // Dynamic mock response fallbacks based on text content
    let fallback = '';
    if (isPro) {
      fallback = `This uplifting force suggests a strong alignment with your growth. Ask yourself: does pursuing this reflect who you want to become, or is it a temporary relief?`;
      if (itemText.toLowerCase().includes('money') || itemText.toLowerCase().includes('pay')) {
        fallback = `Finances represent safety and freedom. Let's reflect on how this financial benefit supports your mental energy and long-term values, rather than just material security.`;
      } else if (itemText.toLowerCase().includes('peace') || itemText.toLowerCase().includes('happy')) {
        fallback = `Prioritizing your peace is a vital step. Notice how this thought brings lightness; how can you protect this feeling as you weigh your options?`;
      }
    } else {
      fallback = `Notice how this hesitation might stem from a natural desire for safety and comfort. While valid, consider if this is a familiar pattern of avoiding uncertainty or a genuine risk.`;
      if (itemText.toLowerCase().includes('fail') || itemText.toLowerCase().includes('scared')) {
        fallback = `Fear of failure is a powerful signal. If you took away the fear for just a moment, what would your wisest self want to choose?`;
      } else if (itemText.toLowerCase().includes('hard') || itemText.toLowerCase().includes('work') || itemText.toLowerCase().includes('time')) {
        fallback = `Energy and time boundaries are real limits. How might you pace yourself to accommodate this effort without compromising your core well-being?`;
      }
    }

    return this.requestCompletion(apiKey, systemPrompt, userPrompt, fallback);
  },

  /**
   * Generates overall decision workspace analysis
   */
  async generateDecisionInsight(
    apiKey: string,
    decision: Decision
  ): Promise<string> {
    const prosText = decision.pros.map((p) => `- ${p.text}`).join('\n');
    const consText = decision.cons.map((c) => `- ${c.text}`).join('\n');
    
    const systemPrompt = `You are a wise, empathetic therapeutic assistant inside 'Digital Sanctuary'.
Review the user's decision context, their pros (uplifting forces), cons (friction points), and their current emotional state.
Generate a brief, supportive summary (around 3-4 sentences max, under 80 words).
- Acknowledge the emotional tension (e.g. anxiety, hopefulness, or hesitation).
- Gently highlight patterns (e.g., if pros align with long-term growth and cons reflect short-term fear).
- Provide a personalized, long-term mindful perspective.
Do not prescribe a specific choice. Encourage slow, mindful reflection.`;

    const userPrompt = `Decision Title: "${decision.title}"
Description: "${decision.description}"
Uplifting Forces (Pros):
${prosText || 'None listed yet'}
Friction Points (Cons):
${consText || 'None listed yet'}
Current Emotions: Clarity: ${decision.initialMood?.clarity ?? 50}%, Anxiety: ${decision.initialMood?.anxiety ?? 50}%, Hopefulness: ${decision.initialMood?.hopefulness ?? 50}%`;

    const fallback = `As you weigh "${decision.title}," there is a noticeable conversation between your hopes and your hesitations. The forces pushing you forward represent a desire for growth, while the friction points reflect your system's natural drive to protect you from risk. Take a moment to honor both sides. The clarity you seek isn't about finding a perfect choice, but about choosing with full awareness of your feelings.`;

    return this.requestCompletion(apiKey, systemPrompt, userPrompt, fallback);
  },

  /**
   * Conversational Second Brain Chat
   */
  async sendChat(
    apiKey: string,
    decision: Decision,
    chatHistory: { sender: 'user' | 'assistant'; text: string; timestamp: string }[],
    newMessage: string,
    pastDecisions: Decision[],
    pastMoods: any[]
  ): Promise<string> {
    const prosText = decision.pros.map((p) => `- ${p.text}`).join('\n');
    const consText = decision.cons.map((c) => `- ${c.text}`).join('\n');
    
    // Format historical context
    const historySummary = pastDecisions
      .filter((d) => d.status === 'Completed')
      .slice(0, 3)
      .map((d) => `- Decided: "${d.title}" (Outcome: ${d.outcome || 'Success'})`)
      .join('\n');
      
    const moodSummary = pastMoods
      .slice(0, 3)
      .map((m) => `- Mood check: Clarity ${m.clarity}%, Anxiety ${m.anxiety}%, sensations: ${m.bodySensations.join(', ')}`)
      .join('\n');

    const systemPrompt = `You are "Second Brain", a highly personalized, empathetic AI therapeutic chatbot inside the 'Digital Sanctuary' decision-making app.
You act as the user's secondary mind, helping them clarify complex thoughts.
Your goal is to have a continuous conversational dialogue.
You have access to:
1. Current active decision: "${decision.title}" (${decision.description || 'No description'})
2. Current Uplifting Forces (Pros):
${prosText || 'None'}
3. Current Friction Points (Cons):
${consText || 'None'}
4. Historical Decisions context:
${historySummary || 'None recorded yet'}
5. Historical Mood logs:
${moodSummary || 'None recorded yet'}

CRITICAL GUIDELINES:
- Talk like a supportive companion. Keep responses conversational, warm, and highly relevant.
- Do NOT make choices for the user. Instead, ask a deep, open-ended question that makes them evaluate their inner values.
- You can suggest a NEW Pro or Con for their active decision. If you suggest one, format it exactly as:
  "[PRO: <suggested pro text>]" or "[CON: <suggested con text>]" on a new line, so the app can parse it. Make these suggestions highly tailored to their current situation and past history!
- Respond concisely (under 100 words).`;

    // Map chatHistory to OpenAI messages format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: newMessage },
    ];

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const lowerMsg = newMessage.toLowerCase();
      if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        return `Hello! I am your Second Brain. I can see you are weighing "${decision.title}". Looking at your forces and friction points, what is the biggest source of hesitation you feel right now?\n\n[CON: Fear of making the wrong choice]`;
      }
      if (lowerMsg.includes('help') || lowerMsg.includes('pro') || lowerMsg.includes('con') || lowerMsg.includes('what else')) {
        return `Let's dig deeper. Based on your dilemma, you might be overlooking how this aligns with your long-term energy. Have you considered how this decision affects your day-to-day peace?\n\n[PRO: Better alignment with daily energy levels]\n[CON: Initial energy drain during transition]`;
      }
      return `I hear you. When you reflect on "${newMessage}", how does that match the goals you set for yourself? Do you feel this thought more as an uplifting pull or a point of friction?\n\n[PRO: Increased sense of personal agency]`;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        return `I had a temporary connection issue. Let's think about this: how does your current point relate to your core values?`;
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      return `I am currently offline, but let's keep reflecting. What would your wisest self say about this factor?`;
    }
  },

  /**
   * Transcribe user speech recording using Whisper API
   */
  async transcribeAudio(apiKey: string, fileUri: string): Promise<string> {
    if (!apiKey) {
      // Simulate audio processing latency then return mock
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return "I'm reflecting on whether relocating is good for my mental health.";
    }

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('file', blob, 'recording.m4a');
      } else {
        formData.append('file', {
          uri: fileUri,
          name: 'recording.m4a',
          type: 'audio/m4a',
        } as any);
      }
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper transcription error:', errorText);
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.text.trim();
    } catch (e) {
      console.error('Error during transcription:', e);
      return "I couldn't hear you clearly. Please try speaking again.";
    }
  },

  /**
   * Generate speech from text using OpenAI TTS API
   */
  async generateSpeech(apiKey: string, text: string): Promise<string> {
    if (!apiKey) {
      return '';
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'shimmer', // Soft, therapeutic female voice
        }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const blob = await response.blob();
      if (Platform.OS === 'web') {
        return URL.createObjectURL(blob);
      } else {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.error('Error during TTS generation:', e);
      return '';
    }
  },

  /**
   * Generates somatic and cognitive insights based on the daily check-in
   */
  async generateJournalInsight(
    apiKey: string,
    clarity: number,
    anxiety: number,
    hopefulness: number,
    sensations: string[],
    note: string
  ): Promise<string> {
    const systemPrompt = `You are a somatic and CBT therapeutic counselor.
Based on the user's emotional baseline check-in, offer a brief, highly comforting 2-sentence response.
- Address where they carry their stress in their body: [${sensations.join(', ')}].
- Provide a comforting somatic release tip or CBT reframe.
Keep the tone exceptionally warm, supportive, and under 50 words.`;

    const userPrompt = `Check-in Metrics:
- Clarity: ${clarity}%
- Anxiety: ${anxiety}%
- Hopefulness: ${hopefulness}%
- Somatic Sensations: ${sensations.join(', ') || 'None listed'}
- Journal reflection text: "${note || 'No notes written'}"`;

    const fallback = `I notice you are carrying some tension in your system today. Try taking a slow, long exhale, dropping your shoulders, and allowing yourself to be exactly as you are right now. You are doing the best you can.`;

    return this.requestCompletion(apiKey, systemPrompt, userPrompt, fallback);
  },
};
