# 🕯️ MeetSync: The Sensory Meeting Workspace

MeetSync is a video conferencing platform reimagined for individual focus and sensory comfort. Moving away from standard corporate tools, MeetSync prioritizes the **human experience** of digital collaboration through curated environments and tactile documentation.

![MeetSync Banner](https://img.shields.io/badge/Focus-Atmospheric%20Conferencing-orange?style=for-the-badge)
![Zen Sync](https://img.shields.io/badge/Feature-Zen%20Sync-blue?style=for-the-badge)
![Parchment Theme](https://img.shields.io/badge/Aesthetic-Parchment%20Modern-green?style=for-the-badge)

---

## 🌿 Unique Feature: Zen Sync (Atmospheric Environments)

MeetSync introduces **Zen Sync**, a revolutionary way to battle meeting fatigue by synchronizing the sensory environment of your digital workspace. 

*   **Curated Scapes**: Choose between environments like *Ancient Library*, *Midnight Code*, or *Rainy Haven*.
*   **Dedicated Atmosphere Panel**: A new sidebar-accessible workspace to manage your sensory immersion and focus settings.
*   **Sensory Immersion**: Each scape dynamically adjusts the UI color palette, CSS filters (sepia, contrast, brightness), and introduces high-quality ambient soundscapes.
*   **Focus-Driven UX**: By altering the visual and auditory field, individuals can enter "Flow States" more easily during long sessions.
*   **Adaptive Theme**: The application's "Parchment Modern" aesthetic scales with your mood, from warm, tactile tones to deep, high-contrast dark modes.

## 📹 Full-Featured Personal Conferencing
*   **Video Mastery**: Powered by Stream.io for ultra-low latency calls.
*   **Personal Archives**: Manage and host your own meeting recordings securely via Firebase.
*   **Link Privacy**: Generate and share meeting links with instant clipboard sync.
*   **Meeting History**: A beautiful, organized history of every session with quick-play capabilities.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Engine** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Environment** | **Adaptive CSS Filters & HSL Morphing** |
| **Database** | [Firestore](https://firebase.google.com/products/firestore) & [Firebase Auth](https://firebase.google.com/products/auth) |
| **Video Engine** | [Stream.io SDK](https://getstream.io/video/docs/react/) |
| **Typography** | Playfair Display & Inter |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+ 
*   Firebase Project (Auth & Storage)
*   Stream.io API Key

### Environment Setup
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_STREAM_API_KEY=...
STREAM_SECRET_KEY=...
```

### Installation
```bash
npm install
npm run dev
```

---

## 📄 License
Distributed under the MIT License.

---

**MeetSync** — *Work in Harmony.*
