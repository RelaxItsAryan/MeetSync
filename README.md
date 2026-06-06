# 🕯️ MeetSync: Sensory Intelligence Workspace

MeetSync is a video conferencing platform reimagined for individual focus and autonomous intelligence. It bridges the gap between **sensory-rich digital environments** and **high-speed AI accountability**, ensuring that every meeting is not just experienced, but remembered and acted upon.

![MeetSync Banner](https://img.shields.io/badge/AI%20Intelligence-Groq%20Llama%203.3-orange?style=for-the-badge)
![Transcription](https://img.shields.io/badge/Transcription-Whisper%20Large%20v3-green?style=for-the-badge)
![Hindsight](https://img.shields.io/badge/Memory-Hindsight%20Sync-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=for-the-badge&logo=next.js)

---

## 🧠 Hindsight: The AI Accountability Engine

MeetSync doesn't just record meetings; it understands them. Powered by **Groq's Llama 3.3 (70B)** and **Whisper-Large-v3**, the Hindsight system provides a persistent intelligence layer for your collaboration.

*   **⚡ Groq-Speed Analysis**: Instant transcription and intelligence extraction using Whisper-large-v3 and Llama-3.3-70b-versatile.
*   **🤝 Commitment Tracking**: Automatically detects promises made during calls, including owners and deadlines, syncing them to your long-term memory.
*   **📊 Multi-Dimensional Insights**: Generates factual summaries, sentiment analysis, emotional cues, and risk flags for every session.
*   **💬 Contextual Q&A**: An interactive chat interface that lets you query past meetings—ask "What did we decide on the budget?" and get instant answers from the transcript.
*   **📁 Intelligent Memory**: All transcripts and analyses are indexed and stored in Firestore, creating a searchable archive of human interactions.

---

## 🌿 Zen Sync: Sensory Atmospheric Environments

Beyond intelligence, MeetSync prioritizes the **human experience**. **Zen Sync** battles meeting fatigue by synchronizing your digital workspace with high-fidelity sensory scapes.

*   **Curated Scapes**: Experience *Ancient Library*, *Midnight Code*, or *Rainy Haven* with custom audio and visual styling.
*   **HSL Morphing**: The UI adaptively shifts colors, filters (sepia, contrast, brightness), and typography based on your selected atmosphere.
*   **Spatial Audio**: High-quality ambient soundscapes integrated directly into the sidebar to foster focus and "Flow States."
*   **Parchment Aesthetic**: A sophisticated, tactile UI design focusing on typography (Playfair Display) and warmth over sterile interface standards.

---

## 📹 Full-Featured Conferencing
*   **Ultra-Low Latency**: Powered by the Stream.io Video SDK for professional-grade stability.
*   **Personal Archives**: Manage, play, and analyze your meeting history in a beautiful, organized grid.
*   **Secure Auth**: Bulletproof authentication and data management via Firebase.
*   **Instant Link Sync**: Share meeting invitations with one-click clipboard integration.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Intelligence Engine** | [Groq](https://groq.com/) (Llama 3.3 70B + Whisper Large v3) |
| **Core Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Database & Auth** | [Firebase](https://firebase.google.com/) (Firestore & Auth) |
| **Video Infrastructure** | [Stream.io SDK](https://getstream.io/) |
| **Memory System** | [Hindsight Client](https://hindsight.vectorize.io/) |
| **Styling** | Tailwind CSS + Lucide Icons |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+ 
*   Firebase Project (Auth & Firestore)
*   Stream.io API Credentials
*   Groq API Key (for Analysis)

### Environment Setup
Create a `.env` file with the following:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_STREAM_API_KEY=...
STREAM_SECRET_KEY=...
GROQ_API_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Installation
```bash
# Clone and install
npm install

# Run the sensory workspace
npm run dev
```

---

## 📄 License
Distributed under the MIT License.

---

**MeetSync** — *Intelligent Harmony.*
