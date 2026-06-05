'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useFirebaseUser();
  const clientRef = useRef<StreamVideoClient>();
  const uidRef = useRef<string>();

  useEffect(() => {
    // Don't do anything until Firebase auth is resolved
    if (!isLoaded) return;

    // User signed out — disconnect and clear
    if (!user) {
      if (clientRef.current) {
        clientRef.current.disconnectUser();
        clientRef.current = undefined;
        uidRef.current = undefined;
        setVideoClient(undefined);
      }
      return;
    }

    // Already connected for the same user — skip
    if (clientRef.current && uidRef.current === user.uid) return;

    if (!API_KEY) throw new Error('Stream API key is missing');

    // Token provider calls our server action
    const serverTokenProvider = async () => {
      const res = await fetch('/api/stream-token');
      if (!res.ok) throw new Error('Failed to get Stream token');
      const { token } = await res.json();
      return token as string;
    };

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user.uid,
        name: user.displayName || user.email || user.uid,
        image: user.photoURL || undefined,
      },
      tokenProvider: serverTokenProvider,
    });

    clientRef.current = client;
    uidRef.current = user.uid;
    setVideoClient(client);

    return () => {
      client.disconnectUser();
      clientRef.current = undefined;
      uidRef.current = undefined;
    };
  }, [user, isLoaded]);

  // Don't block rendering — pages and navigation appear instantly.
  // Components that need Stream handle their own loading state.
  if (!videoClient) return <>{children}</>;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
