# 🤖 MeetSync: Multi-Agent Meeting Intelligence Ecosystem

MeetSync is not just a video calling platform—it's a sophisticated **Multi-Agent AI Ecosystem** designed to automate meeting management, commitment tracking, and enterprise-grade accountability. By deploying a suite of specialized AI Agents, MeetSync transforms every conversation into a structured database of actionable intelligence.

![MeetSync Banner](https://img.shields.io/badge/AI%20Agents-Llama%203.3%20%2B%20Whisper-orange?style=for-the-badge)
![Accountability Engine](https://img.shields.io/badge/Engine-Accountability%20Intelligence-blue?style=for-the-badge)
![Groq Powered](https://img.shields.io/badge/Powered%20By-Groq-green?style=for-the-badge)

---

## 🧠 The Multi-Agent Intelligence System

MeetSync operates using three core specialized agents that process meeting data in a pipeline to ensure maximum accuracy and depth.

### 1. 📋 The Intelligence Extraction Agent
This agent performs the primary post-meeting analysis, converting audio into high-fidelity structured data.
*   **Deep Summary & Sentiment**: Goes beyond basic notes to capture the emotional tone and outcomes.
*   **Commitment Intelligence**: Automatically identifies promises, obligations, and deliverables.
*   **Risk & Blocker Detection**: Flags potential future problems (risks) versus active progress-preventers (blockers).
*   **Structured Output**: Generates valid JSON intelligence covering decisions, questions raised, and participant intent.

### 2. ⚖️ The Accountability Engine (Agent 3)
The "Brain" of MeetSync's persistence. It compares the current meeting with your organization's entire history.
*   **Historical Alignment**: Syncs current promises with past commitments to check for consistency.
*   **Reliability Scoring**: Assigns a **Reliability Score (0-100)** to participants based on their track record of completing deliverables.
*   **Pattern Recognition**: Detects repeated delays or circular commitments (e.g., the same approval promised in three consecutive meetings).
*   **Escalation Alerts**: Automatically identifies if an overdue task creates a critical downstream launch risk.

### 3. 🎯 The Strategic Preparation Agent
Acts as your personal advisor before you even enter the room.
*   **Executive Briefings**: Summarizes relationship history and project status in 3-5 high-impact sentences.
*   **Recommended Strategy**: Advises on how to approach a meeting based on the participants' historical reliability and open items.
*   **Dynamic Questioning**: Generates "hard questions" to move projects forward based on identified blockers.

---

## 🚀 Advanced Analysis Features

*   **Interactive Meeting Q&A**: Each recording becomes a searchable knowledge base. Ask "Who agreed to the API change?" or "What was the budget concern?" and get cited answers instantly.
*   **Relationship Intelligence**: Understand participant dynamics over time, including consistency, sentiment trends, and past collaboration hurdles.
*   **Real-time Intelligence Pipeline**: Processes video recordings directly from Stream.io through **Groq's Whisper-large-v3** and **Llama-3.3-70b** for near-instant results.

---

## 🛠️ The Technology Behind the Intelligence

| Layer | Component | Implementation |
| :--- | :--- | :--- |
| **LLM Inference** | **Groq LPU™** | Blazing-fast Llama 3.3 70B & Whisper-v3 |
| **Memory** | **Cloud Firestore** | Persistent storage for historical commitments & reliability matrices |
| **Video Engine** | **Stream.io** | High-fidelity recording and low-latency conferencing |
| **Framework** | **Next.js 14** | Secure Server Actions and highly responsive UI |

---

## 🎨 Aesthetic: Parchment Modern
MeetSync utilizes a custom **Parchment Modern** design system. This isn't just a theme; it's a productivity-focused interface that combines high-contrast typography (Playfair Display) with warm, non-fatiguing backgrounds, making long analysis sessions comfortable for the eyes.

---

## 📦 Getting Started

### Prerequisites
*   Node.js 18+ 
*   Groq API Key (Llama 3.3 and Whisper support)
*   Firebase (Auth & Firestore)
*   Stream.io (Video SDK)

### Environment Setup
```env
# AI & INFRASTRUCTURE
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_STREAM_API_KEY=...
STREAM_SECRET_KEY=...

# PERSISTENCE
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... other firebase keys
```

### Quick Run
```bash
npm install
npm run dev
```

---

## 📄 License
Distributed under the MIT License.

---

**MeetSync** — *From Conversations to Commitment Intelligence.*
