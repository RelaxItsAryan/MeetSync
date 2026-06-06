import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);

export async function POST(req: Request) {
  const tempFiles: string[] = [];
  try {
    const body = await req.json();
    const { video_url, recording_id, meeting_title } = body;

    if (!video_url || !recording_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
    }

    // 1. Create temp directory
    const tempDir = os.tmpdir();
    const videoPath = path.join(tempDir, `video_${recording_id}.mp4`);
    const audioPath = path.join(tempDir, `audio_${recording_id}.mp3`);
    tempFiles.push(videoPath, audioPath);

    // 2. Download video
    console.log('Downloading video...');
    const videoResponse = await fetch(video_url);
    if (!videoResponse.ok) throw new Error('Failed to download video');
    const arrayBuffer = await videoResponse.arrayBuffer();
    fs.writeFileSync(videoPath, new Uint8Array(arrayBuffer));

    // 3. Extract audio using ffmpeg
    console.log('Extracting audio...');
    try {
      await execPromise(`ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -ab 32k -f mp3 "${audioPath}" -y`);
    } catch (ffmpegErr) {
      console.error('FFmpeg Error:', ffmpegErr);
      throw new Error('Failed to process video audio');
    }

    // 4. Send to Groq Whisper for transcription
    console.log('Transcribing with Groq Whisper...');
    const formData = new FormData();
    const audioBuffer = fs.readFileSync(audioPath);
    formData.append('file', new Blob([new Uint8Array(audioBuffer)]), 'audio.mp3');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');

    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json();
      throw new Error(`Whisper API Error: ${errorData.error?.message || whisperResponse.statusText}`);
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text;

    if (!transcript) throw new Error('Failed to receive transcript from Groq');

    // 5. Build Analysis Prompt for Llama-3
    const prompt = `You are a meeting intelligence analyst. Analyze this meeting transcript carefully.
Return ONLY a valid JSON object with no markdown, no explanation, no preamble.

{
  "summary": "3-4 sentence factual summary of the meeting",
  "sentiment": "positive | neutral | negative | mixed",
  "participants": ["name or role if identifiable"],
  "topics_discussed": ["topic 1", "topic 2"],
  "promises_made": [
    { "by": "who made the promise", "promise": "what was promised", "deadline": "deadline or null" }
  ],
  "objections_raised": ["objection 1"],
  "competitor_mentions": ["any competitor or alternative mentioned"],
  "emotional_cues": ["specific observation about tone or emotion"],
  "risk_flags": ["any risk or warning sign"],
  "next_steps": ["action item 1", "action item 2"],
  "key_quotes": ["important verbatim quote from the meeting"],
  "deal_stage": "prospecting | discovery | proposal | negotiation | closed | not_applicable",
  "overall_score": 8
}

Transcript:
${transcript}`;

    // 6. Call Groq Llama-3 for analysis
    console.log('Analyzing with Groq Llama-3...');
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

    // 7. Save to Firestore
    await setDoc(doc(db, 'meeting_analyses', recording_id), {
      analysis,
      transcript,
      video_url,
      meeting_title,
      analyzed_at: serverTimestamp(),
    });

    return NextResponse.json({ success: true, analysis, transcript });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    // Clean up temp files
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
}
