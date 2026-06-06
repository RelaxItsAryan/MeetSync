# I Trapped Promises Inside Meeting Transcripts With Hindsight

When you finish a meeting, something gets lost. It's not the recording—that lives safely in Firebase. It's not the notes—those exist somewhere in your Slack channel or notebook app. What vanishes is the *context*. The specific promise someone made about pricing in week three. The risk flag that came up casually in conversation. The emotional undertone of a discussion about resourcing. That stuff evaporates. Then three weeks later, your manager asks what happened with the pricing promise, and you're hunting through video timestamps instead of actually answering the question.

I solved this by building MeetSync—a video conferencing platform that doesn't just record meetings. It traps the commitments, context, and intelligence buried inside transcripts and makes them permanently, searchably available through [Hindsight](https://github.com/vectorize-io/hindsight), a memory system for AI agents.

## How the System Works

MeetSync is built on Next.js 14 with Stream.io for video conferencing, but the real story is in the backend pipeline. When a meeting ends and someone initiates a recording analysis, the system launches a processing chain that transforms raw audio into semantic artifacts stored in a vector database.

Here's the flow: First, we download the recorded video and extract audio using FFmpeg, normalizing it to 16kHz mono—standard for speech recognition. We send that audio to [Groq's Whisper API](https://api.groq.com/openai/v1/audio/transcriptions), which gives us a full transcript in seconds. That transcript then feeds into Groq's Llama-3.3 LLM with a carefully structured prompt asking it to extract specific entities: promises made (with who, what, and deadline), next steps, risk flags, sentiment, emotional cues, deal stage, and key quotes.

The JSON output from Llama gets stored in Firestore alongside the original transcript. But here's the crucial step—we simultaneously ingest all this context into [Hindsight](https://hindsight.vectorize.io/) as rich narrative documents with structured metadata.

```typescript
// From lib/hindsight.ts - the core retention mechanism
export const retainMeetingMemory = async (data: {
  userId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  analysis: any;
}) => {
  const content = `Meeting: ${meetingTitle} on ${meetingDate}.
Summary: ${analysis.summary || "No summary"}.
Sentiment: ${analysis.sentiment || "Neutral"}.
Promises made: ${(analysis.promises_made || []).map((p: any) => 
  typeof p === 'string' ? p : p.promise).join(", ") || "None"}.
Next steps: ${(analysis.next_steps || []).join(", ") || "None"}.
Risk flags: ${(analysis.risk_flags || []).join(", ") || "None"}.
Topics: ${(analysis.topics_discussed || []).join(", ") || "None"}.
Emotional cues: ${(analysis.emotional_cues || []).join(", ") || "None"}.
Key quotes: ${(analysis.key_quotes || []).join(", ") || "None"}.`;

  const metadata = {
    userId,
    meetingId,
    meetingDate,
    sentiment: analysis.sentiment,
    dealStage: analysis.deal_stage,
    hasPromises: (analysis.promises_made || []).length > 0,
    hasRisks: (analysis.risk_flags || []).length > 0,
  };

  await client.ingest({
    pipelineId,
    documents: [{
      content,
      metadata,
    }],
  });
};
```

This is where Hindsight becomes essential. Rather than trying to query Firestore with fuzzy string matching, we're storing meeting context as semantic vectors. That "pricing promise" from three weeks ago isn't just a text string—it's embedded in a multidimensional space where semantically similar queries naturally surface it, even if they use different words.

## The Intelligence Search: Querying Across All Your Meetings

The magic emerges when users land on the Intelligence page and search: "What promises did I make about pricing?" or "Which meetings had negative sentiment?"

```typescript
// From app/api/intelligence/search/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const { query, userId } = body;

  const results = await recallMeetingMemory(query, userId);
  return NextResponse.json({ results });
}

// From lib/hindsight.ts
export const recallMeetingMemory = async (query: string, userId: string) => {
  const response = await client.query({
    pipelineId,
    query: `[${userId}]: ${query}`,
    limit: 5,
  });
  return response.results || [];
};
```

That `[userId]: ${query}` prefix matters. It scopes the search to the user's own meeting memory, preventing cross-contamination in a multi-tenant environment. Hindsight's semantic search returns the top five relevant meetings as cards, each showing metadata like sentiment (positive/neutral/negative), the meeting title, date, and a snippet of the extracted content.

This is fundamentally different from searching a transcript database. Hindsight isn't doing keyword matching—it's finding conceptually related meeting contexts. You ask about "budget discussion for Q2," and it returns meetings where pricing, resources, and timeline were discussed, even if those exact terms aren't in your query.

## Promises with Deadlines, Risk Flags with Sentiment

When Llama analyzes a transcript, it extracts promises with structure:

```typescript
// From the analysis schema sent to Hindsight
"promises_made": [
  { 
    "promise": "what was promised", 
    "by": "who", 
    "deadline": "date or timeline mentioned, or 'not specified'" 
  }
]
```

Same structure for risk flags, next steps, and emotional cues. By storing these as structured metadata alongside the narrative content, we make Hindsight both semantic and queryable. You can search "promises with deadline next month" or "meetings with risk flags and negative sentiment" because the metadata is there.

The system also tags each meeting with a deal stage (prospecting, discovery, proposal, negotiation, closed, or not_applicable). This lets sales teams search "all discovery conversations with this prospect" or "what commitments did we make in the proposal stage?" The context becomes actionable.

## Concrete Example: The Pricing Promise

Let's trace what happens in practice. Sarah, a sales engineer, finishes a two-hour call with a prospect. She clicks "Analyze Recording." Within 90 seconds, the system:

1. Downloads the 2GB video file
2. Extracts and normalizes audio
3. Whispers the entire call into text (let's say 8,000 words)
4. Feeds it to Llama-3.3, which returns structured analysis identifying seven promises made: four about custom integrations, two about timeline, one about pricing flexibility
5. Stores the full transcript and analysis in Firestore
6. Simultaneously ingests a narrative document into Hindsight containing the meeting summary, all promises with assignees and deadlines, the detected sentiment (positive), and flagged emotional cues ("excitement about timeline," "concern about implementation burden")

Two days later, Sarah's manager asks: "Did we commit to any pricing changes with that prospect?" Sarah types that exact question into Intelligence. Hindsight surfaces that meeting at the top of results—not because of exact keyword match, but because the semantic meaning aligns with her query. She clicks "View Recording," sees the promises structured in the analysis tab, and immediately knows which specific pricing commitment was made and to whom.

Three weeks later, Sarah's building integration code. She wants to check: "What other calls have we had about custom integrations?" Intelligence returns three past meetings—two with different prospects, one with the same prospect from a follow-up call. She reviews them quickly, avoiding duplicate work and staying in sync with what was promised.

## The Architecture: Why Hindsight Instead of Traditional Search

I considered a simpler approach: store analysis in Firestore, query with Algolia or Elasticsearch. But that pattern has problems at scale:

**Semantic gap**: Keywords don't capture meaning. "Budget conversations" vs. "resource allocation vs. "spending limits" are semantically close but lexically different. Traditional search misses them.

**Metadata fusion**: [Hindsight's vector approach](https://vectorize.io/what-is-agent-memory) lets us embed structured metadata (sentiment, deal stage, promise presence) directly in the retrieval mechanism. Relevance ranking naturally incorporates these dimensions.

**Multi-dimensional context**: With traditional keyword search, you can search for "promises" or search for "negative sentiment," but combining both requires custom query logic. Hindsight's embeddings make compound queries natural.

**Fire-and-forget reliability**: The analysis API ingests into Hindsight asynchronously—if it fails, it logs and moves on. Users get their Firestore analysis instantly; Hindsight enrichment happens in the background. No blocking, no cascading failures.

```typescript
// From app/api/analyze-recording/route.ts
// 5. Hindsight Retention (Fire-and-forget)
retainMeetingMemory({
    userId,
    meetingId: recording_id,
    meetingTitle: meeting_title,
    meetingDate: meeting_date || new Date().toISOString(),
    analysis
}).catch(err => console.error("Hindsight retain failed:", err));

return NextResponse.json({ success: true, analysis, transcript });
```

This matters because analysis latency is user-facing. Firestore writes are fast. Hindsight ingestion is still fast, but decoupling it from the response path means users get immediate feedback while the memory system enriches asynchronously.

## A Secondary Layer: Chat with Context

Beyond search, users can chat with individual recording analyses. We fetch the transcript and analysis from Firestore, pass them into a system prompt for Llama-3.3, and let the user ask follow-up questions.

```typescript
// From app/api/chat-recording/route.ts
const systemPrompt = `You are an AI meeting assistant for MeetSync. 
You are helping a user with questions about the meeting titled "${meeting_title}".

Context:
- Transcript: ${transcript}
- Summarized Insights: ${JSON.stringify(analysis)}

Instructions:
- Answer questions factually based ONLY on provided transcript and insights.
- If you don't know, say so based on the transcript.
- Be concise and professional.`;
```

This isn't Hindsight—it's traditional retrieval-augmented generation. But it works in tandem: chat answers questions about one meeting's details; Intelligence answers cross-meeting questions about patterns, promises, and context.

## Why This Matters

The real problem MeetSync solves isn't "how do we record meetings?" Every tool does that. It's "how do we retain the human commitments, risks, and context that emerge in real-time conversation?"

Meetings are where commitment happens. "I'll get that spec to you by Friday." "We're concerned about scalability." "Sarah owns the integration." Those statements matter. They shape what happens next. But the instant the Zoom call ends, they become scattered data points—a recording file, maybe notes in someone's doc, maybe a Slack message if someone bothers to summarize.

Hindsight changes this. It transforms meeting context into a persistent, searchable, agent-accessible memory. The system doesn't just understand what was said; it captures *what was committed to*, by whom, with what deadline, and in what emotional context. That structure is what makes it useful.

## Lessons Learned

**Semantic search beats keyword search for meeting intelligence.** The moment you move from "find this exact word" to "find relevant context," you need embeddings. People ask questions in natural language, but they're asking for semantic relationships. Traditional search struggles here.

**Structured extraction from LLM output enables better retrieval.** By asking Llama to return JSON with specific fields (promises, risks, sentiment), we get both human-readable summaries AND machine-queryable metadata. That metadata feeds into Hindsight's filtering and ranking, making results more relevant.

**Decoupling analysis from memory ingestion reduces latency friction.** Fire-and-forget background ingestion means users get immediate Firestore results while the richer vector memory updates asynchronously. This keeps the UI responsive while still guaranteeing the data gets stored.

**User IDs are critical for multi-tenant vector systems.** Scoping Hindsight queries with `[userId]: ${query}` is simple but essential. Without it, one user's meeting context could leak into another's search results.

**Metadata-rich documents outperform bare transcripts for retrieval.** Instead of storing the full 8,000-word transcript as a single vector, we store a structured narrative that weaves together the summary, promises, risks, sentiment, and quotes. Hindsight retrieves the whole narrative, which gives users enough context to act without them reading the full transcript.

The system works because it respects a fundamental truth: meetings are about commitments, not information transfer. The information (what was discussed) matters less than the commitments (what will happen next). By trapping those promises inside Hindsight's memory, we make them discoverable, accountable, and useful.

---

**MeetSync uses [Hindsight](https://hindsight.vectorize.io/) to power agent memory for meeting context retrieval. Learn more about [agent memory systems](https://vectorize.io/what-is-agent-memory) on Vectorize.**
