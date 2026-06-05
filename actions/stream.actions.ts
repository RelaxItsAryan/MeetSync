'use server';

import { StreamClient } from '@stream-io/node-sdk';
import { cookies } from 'next/headers';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async () => {
  // Get the Firebase ID token from cookie to extract the user ID
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('firebase-auth-token');

  if (!tokenCookie?.value) throw new Error('User is not authenticated');
  if (!STREAM_API_KEY) throw new Error('Stream API key secret is missing');
  if (!STREAM_API_SECRET) throw new Error('Stream API secret is missing');

  // Decode the JWT to get the user ID (uid is in the 'sub' claim)
  const payload = JSON.parse(
    Buffer.from(tokenCookie.value.split('.')[1], 'base64').toString('utf8')
  );
  const userId: string = payload.user_id || payload.sub;

  if (!userId) throw new Error('Could not extract user ID from token');

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  const token = streamClient.createToken(userId, expirationTime, issuedAt);

  return token;
};
