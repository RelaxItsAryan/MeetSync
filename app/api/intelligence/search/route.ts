import { NextResponse } from 'next/server';
import { recallMeetingMemory } from '@/lib/hindsight';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, userId } = body;

    if (!query || !userId) {
      return NextResponse.json({ error: 'Missing query or userId' }, { status: 400 });
    }

    const results = await recallMeetingMemory(query, userId);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Intelligence Search Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
