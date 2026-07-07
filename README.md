# Digital Sanctuary

Digital Sanctuary is a privacy-first, cross-platform mobile application designed to help users manage mental health, track emotional trends, and make structured decisions. The app runs locally on your device, using local storage to ensure your personal data remains private. You can connect an OpenAI API key to enable conversational dialogue with a Second Brain companion and vocal speech interfaces.

---

## What Was Built

The application contains several key modules:

### 1. Onboarding Flow (src/screens/OnboardingScreen.tsx)
* Introduces the core concepts of the app.
* Collects the user's name.
* Takes an initial assessment of the user's clarity and anxiety levels to establish an emotional baseline.
* Safely saves an optional OpenAI API key locally.
* Walks the user through a quick breathing exercise before opening the app dashboard.

### 2. Reflect Hub (src/screens/ReflectScreen.tsx)
* Displays a daily greeting and a summary of recent emotional trends (Calm, Anxiety, Clarity).
* Lists active dilemmas.
* Displays adaptive warning banners if emotional check-ins show high anxiety or low clarity.
* Displays a feelAI inquiry card that prompts the user to start a voice call to explore active decisions.

### 3. Deepen Workspace (src/screens/DeepenScreen.tsx)
* Provides a split-column balance scale for listing pros (uplifting forces) and cons (friction points).
* Splits items into individual cards supporting tap-to-edit actions.
* Integrates a Second Brain Dialogue chat window where users can discuss the decision back-and-forth.
* The AI companion suggests new factors in the chat, which appear as clickable pills to easily add them directly into your pros and cons list.

### 4. feelAI Voice Dialogue (src/screens/VoiceCallScreen.tsx)
* Simulates a phone call interface with active status waves.
* Routes audio playback directly to the main speakerphone rather than the quiet earpiece.
* Plays a welcome greeting vocally once the call connects.
* Allows the user to hold the microphone button to record thoughts, transcribes them via Whisper, computes a response, and speaks the reply back using the OpenAI Text-to-Speech engine.

### 5. Journal Screen (src/screens/JournalScreen.tsx)
* Captures emotional levels (Clarity, Anxiety, Hopefulness) using discrete step selectors on top of color gradient tracks.
* Toggles physical locations where stress is carried in the body (e.g., jaw, chest, shoulders).
* Displays random journaling prompts.
* Generates a custom AI somatic reflection card once saved, providing immediate therapeutic feedback.

### 6. Growth Ledger (src/screens/ProgressScreen.tsx)
* Displays a timeline of closed decisions, their outcomes, and the emotional changes from beginning to resolution.

### 7. Safe Zone (src/screens/SafeZoneScreen.tsx)
* Houses a box-breathing timer with a pulsing visual guide.
* Includes a 5-4-3-2-1 grounding checklist.
* Provides a guide on common cognitive distortions (CBT distortions) and a helpline directory.

### 8. Custom Capsule Navigation (App.tsx)
* Implements a floating tab bar at the bottom of the screen designed with a translucent background (glassmorphism) and smooth fade transitions.

---

## What Needs to Be Built Next

If you want to continue expanding the application, consider adding:
* **Voice Call Logs**: Create a storage system to log and retrieve the text transcripts from past feelAI voice calls.
* **Secondary Theme Toggle**: Configure additional color schemes in the settings panel (like a Teal or Warm Clay variation) that update the app-wide style variables.
* **Push Notifications**: Set up reminders for daily check-ins or alert warnings to take breathing pauses.
* **EAS Native Builds**: Use Expo Application Services to generate native build binaries (.apk for Android, .ipa for iOS) for distribution.

---

## How the Code is Structured

* **App.tsx**: The root component. It handles navigation state, loads custom fonts, and manages the shell viewport layout.
* **src/theme.ts**: The global styling system. All design parameters, colors, fonts, and spacing scales are managed here.
* **src/storage.ts**: The local database wrapper. It reads and writes JSON objects to the device's local storage.
* **src/openai.ts**: The API handler that sends requests to OpenAI for completions, Whisper transcriptions, and speech generation.
* **src/screens/**: Contains the individual screen files.

---

## How to Run the App Locally

This project runs on Expo SDK 54. 

1. **Install Dependencies**:
   Open a terminal in the project folder and install the package dependencies:
   ```bash
   npm install
   ```
2. **Start the Tunnel Server**:
   Start the development server with the tunnel flag. This is useful for testing on public Wi-Fi networks (like hotel networks) that restrict local connections:
   ```bash
   npx expo start --tunnel
   ```
3. **Open on Your Phone**:
   Download the **Expo Go** app on your phone, open it, and choose to enter a URL manually. Use the address printed in the terminal (for example: `exp://wuybkbk-anonymous-8081.exp.direct`).

---

## Continuing Work with Antigravity

Antigravity is a pair-programming assistant that works directly inside your project files. You can continue building this application by talking to it in regular English. 

Here are some guidelines on how to collaborate:

* **Describe what you want to change**: You do not need to write code manually. Just ask Antigravity to perform the work. For example:
  * "Add a new slider on the journal page to track energy levels."
  * "Change the primary color scheme to use soft blue tones instead of sage green."
* **Run builds and checks**: Ask Antigravity to run commands to test if changes compile cleanly. For example:
  * "Verify that the app compiles for web."
  * "Start the server and check the logs."
* **Fixing errors**: If the application crashes on your device, copy the error screen message and paste it to Antigravity. Ask: "I got this error on my phone. Can you find where it is happening and write a fix?"
* **Adding new tools**: If you need to integrate a new library (like an icon set or a native sensor), tell Antigravity: "Add the library for device details, install it via expo install, and show it on the settings screen."
