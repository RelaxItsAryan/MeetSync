import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      return NextResponse.json({ error: 'Stream keys missing' }, { status: 500 });
    }

    // Read the Firebase auth token from cookie
    const tokenCookie = req.cookies.get('firebase-auth-token');
    if (!tokenCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode JWT payload to extract Firebase uid
    const parts = tokenCookie.value.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );
    const userId: string = payload.user_id || payload.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Could not extract user ID' }, { status: 401 });
    }

    const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = streamClient.createToken(userId, expirationTime, issuedAt);

    return NextResponse.json({ token }, {
      headers: {
        // Cache for 50 minutes (token valid for 60 min)
        'Cache-Control': 'private, max-age=3000',
      },
    });
  } catch (error) {
    console.error('Stream token error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
