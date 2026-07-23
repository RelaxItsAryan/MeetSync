import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time static data collection
// which would fail because Firebase client SDK requires a browser environment
export const dynamic = 'force-dynamic';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recording_id, message, history } = body;

    if (!recording_id || !message) {
      return NextResponse.json({ error: 'Missing recording_id or message' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
    }

    // 1. Fetch transcript from request body or Firestore
    let transcript = body.transcript;
    let analysis = body.analysis;
    let meeting_title = body.meeting_title;

    if (!transcript || !analysis) {
      console.log(`[CHAT] Fetching transcript from Firestore fallback for recording ${recording_id}...`);
      // Lazy import firebase to avoid build-time initialization
      const { db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const docRef = doc(db, "meeting_analyses", recording_id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'No analysis found for this recording. Please analyze it first.' }, { status: 404 });
      }

      const docData = docSnap.data();
      transcript = docData.transcript;
      analysis = docData.analysis;
      meeting_title = docData.meeting_title || meeting_title;
    }

    // 2. Chat with Groq Llama-3.3
    console.log(`[CHAT] Asking about recording ${recording_id}: ${message}`);
    
    const systemPrompt = `You are an AI meeting assistant for a platform called MeetSync. 
You are helping a user with questions about the meeting titled "${meeting_title}".

Context:
- Transcript: ${transcript}
- Summarized Insights: ${JSON.stringify(analysis)}

Instructions:
- Answer the user's questions factualy based ONLY on the provided transcript and insights.
- If you don't know the answer, say you don't know based on the transcript.
- Be concise and professional.
- Refer to specific moments or speakers if mentioned in the transcript.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((m: any) => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ],
        temperature: 0.5,
        max_tokens: 1024
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
