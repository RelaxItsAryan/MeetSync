import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { retainMeetingMemory } from '@/lib/hindsight';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const maxDuration = 300; 

import { execSync } from 'child_process';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const getUserIdFromAuthHeader = (req: Request): string => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
        return payload.user_id || payload.sub;
    }
  } catch (e) {
    console.error("Error extracting userId from auth header:", e);
  }
  return "";
};

export async function POST(req: Request) {
  const tempFiles: string[] = [];
  try {
    const body = await req.json();
    const { video_url, recording_id, meeting_title, meeting_date } = body;

    if (!video_url || !recording_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = getUserIdFromAuthHeader(req) || body.userId;
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized: No userId found' }, { status: 401 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
    }

    // 1. Download video
    console.log('Downloading video for Groq analysis...');
    const videoResponse = await fetch(video_url);
    if (!videoResponse.ok) throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    const videoBuffer = await videoResponse.arrayBuffer();

    const tempDir = os.tmpdir();
    const videoPath = path.join(tempDir, `video_${recording_id}.mp4`);
    const audioPath = path.join(tempDir, `audio_${recording_id}.mp3`);
    tempFiles.push(videoPath, audioPath);
    
    fs.writeFileSync(videoPath, new Uint8Array(videoBuffer));

    // 2. Extract Audio with FFmpeg
    console.log('Extracting audio with FFmpeg...');
    try {
      execSync(`ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -ab 64k -f mp3 "${audioPath}" -y`);
    } catch (ffmpegErr) {
      console.error('FFmpeg Error:', ffmpegErr);
      throw new Error('Failed to process video audio. Ensure FFmpeg is installed.');
    }

    const audioBuffer = fs.readFileSync(audioPath);

    // 3. Transcribe with Groq Whisper
    console.log('Transcribing with Groq Whisper...');
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mp3' }), 'recording.mp3');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');

    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json();
      throw new Error(`Whisper API Error: ${errorData.error?.message || whisperResponse.statusText}`);
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text;

    // 3. Analyze with Groq Llama-3.3
    console.log('Analyzing with Groq Llama-3.3...');
    const prompt = `Analyze this meeting transcript carefully. 
Return ONLY a valid JSON object with no markdown, no explanation.

{
  "summary": "3-4 sentence factual summary",
  "sentiment": "positive | neutral | negative | mixed",
  "participants": ["list of names or roles"],
  "topics_discussed": ["topic 1", "topic 2"],
  "promises_made": [
    { "promise": "what was promised", "by": "who", "deadline": "date or timeline mentioned, or 'not specified'" }
  ],
  "next_steps": ["action item 1", "action item 2"],
  "emotional_cues": ["cues"],
  "risk_flags": ["any risks"],
  "key_quotes": ["important quotes"],
  "deal_stage": "prospecting | discovery | proposal | negotiation | closed | not_applicable"
}

Transcript:
${transcript}`;

    const llamaResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a meeting intelligence analyst. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }),
    });

    if (!llamaResponse.ok) {
      const errorData = await llamaResponse.json();
      throw new Error(`Llama API Error: ${errorData.error?.message || llamaResponse.statusText}`);
    }

    const llamaData = await llamaResponse.json();
    const analysis = JSON.parse(llamaData.choices[0].message.content);

    // 4. Save to Firestore
    console.log('Saving analysis to Firestore...');
    await setDoc(doc(db, 'meeting_analyses', recording_id), {
      analysis,
      transcript,
      video_url,
      meeting_title,
      userId,
      analyzed_at: serverTimestamp(),
    });

    // 5. Hindsight Retention (Fire-and-forget)
    retainMeetingMemory({
        userId,
        meetingId: recording_id,
        meetingTitle: meeting_title,
        meetingDate: meeting_date || new Date().toISOString(),
        analysis
    }).catch(err => console.error("Hindsight retain failed:", err));

    return NextResponse.json({ success: true, analysis, transcript });

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
}
