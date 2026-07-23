'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { StreamCall, StreamTheme, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { Loader, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import MeetingSetup from '@/components/MeetingSetup';
import ClassroomRoom from '@/components/ClassroomRoom';
import ClassroomChannel from '@/components/ClassroomChannel';
import { useToast } from '@/components/ui/use-toast';

type PageState = 'channel' | 'meeting-setup' | 'meeting';

export default function ClassroomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoaded, user } = useFirebaseUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>('channel');
  const [call, setCall] = useState<any>(null);
  const [classroomLoading, setClassroomLoading] = useState(true);
  const [classroomExists, setClassroomExists] = useState(false);
  const [startingMeeting, setStartingMeeting] = useState(false);

  const classroomId = (id as string)?.toUpperCase();

  // Verify classroom exists in Firestore
  useEffect(() => {
    if (!classroomId) return;
    const unsubscribe = onSnapshot(
      doc(db, 'classrooms', classroomId),
      (snap) => {
        setClassroomExists(snap.exists());
        setClassroomLoading(false);
      },
      () => setClassroomLoading(false)
    );
    return () => unsubscribe();
  }, [classroomId]);

  const handleStartMeeting = async () => {
    if (!client || !user) {
      toast({ title: 'Connecting to server, please wait...', variant: 'destructive' });
      return;
    }
    setStartingMeeting(true);
    try {
      const streamCall = client.call('default', classroomId);
      await streamCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          settings_override: {
            recording: { mode: 'available', quality: '720p' },
          },
          custom: { description: `Smart Classroom: ${classroomId}` },
        },
      });
      setCall(streamCall);
      setPageState('meeting-setup');
    } catch (error: any) {
      console.error('Failed to start meeting:', error);
      toast({
        title: 'Failed to start meeting',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setStartingMeeting(false);
    }
  };

  const handleLeaveMeeting = () => {
    try { call?.leave(); } catch {}
    setCall(null);
    setPageState('channel');
  };

  // Loading
  if (!isLoaded || classroomLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0e14]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-violet-400 w-8 h-8" />
          <p className="text-gray-500 text-sm">Loading classroom...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!classroomExists) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0d0e14] text-white gap-4">
        <div className="text-7xl select-none">🏫</div>
        <h1 className="text-2xl font-bold">Classroom Not Found</h1>
        <p className="text-gray-500 text-sm">
          The code <span className="font-mono text-violet-400 font-bold">{classroomId}</span> doesn&apos;t match any classroom.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-2 flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors text-sm"
        >
          <ArrowLeft size={15} /> Go back home
        </button>
      </div>
    );
  }

  // Meeting view (setup + live)
  if ((pageState === 'meeting-setup' || pageState === 'meeting') && call) {
    return (
      <main className="h-screen w-full">
        <StreamCall call={call}>
          <StreamTheme>
            {pageState === 'meeting-setup' ? (
              <MeetingSetup setIsSetupComplete={() => setPageState('meeting')} />
            ) : (
              <ClassroomRoom classroomId={classroomId} onLeave={handleLeaveMeeting} />
            )}
          </StreamTheme>
        </StreamCall>
      </main>
    );
  }

  // Channel view (default)
  return (
    <main className="h-screen w-full bg-[#0d0e14] relative">
      {/* Starting meeting overlay */}
      {startingMeeting && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1a1d26] rounded-2xl px-8 py-6 flex items-center gap-4 shadow-2xl border border-white/10">
            <Loader className="animate-spin text-violet-400 w-6 h-6" />
            <p className="text-white font-semibold">Starting meeting...</p>
          </div>
        </div>
      )}
      <ClassroomChannel classroomId={classroomId} onStartMeeting={handleStartMeeting} />
    </main>
  );
}
