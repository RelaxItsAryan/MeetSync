import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { recording_id, message, history } = await req.json();

    if (!recording_id || !message) {
      return NextResponse.json({ error: 'Missing recording_id or message' }, { status: 400 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
    }

    // 1. Fetch transcript from Firestore
    const analysisDoc = await getDoc(doc(db, 'meeting_analyses', recording_id));
    if (!analysisDoc.exists()) {
      return NextResponse.json({ error: 'Analysis/Transcript not found' }, { status: 404 });
    }

    const { transcript, meeting_title } = analysisDoc.data();

    // 2. Build Chat Prompt
    const systemPrompt = `You are a meeting assistant for "${meeting_title}". 
You have been provided with the transcript of the meeting. 
Answer the user's questions based ONLY on the provided transcript.
If the answer is not in the transcript, say you don't know based on the recorded information.
Be concise and helpful.

Transcript:
${transcript}`;

    // 3. Call Groq Llama-3
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
          ...(history || []),
          { role: 'user', content: message }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
