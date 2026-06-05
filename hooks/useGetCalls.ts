import { useEffect, useState } from 'react';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { getMeetingsFromFirestore } from '@/actions/meeting.actions';
import { getRecordingsFromFirestore } from '@/actions/recording.actions';

export const useGetCalls = () => {
  const { user } = useFirebaseUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [firestoreMeetings, setFirestoreMeetings] = useState<any[]>([]);
  const [firestoreRecordings, setFirestoreRecordings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!client || !user?.uid) return;
      
      setIsLoading(true);

      try {
        // 1. Fetch Stream Calls
        const { calls: streamCalls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.uid },
              { members: { $in: [user.uid] } },
            ],
          },
        });
        setCalls(streamCalls);

        // 2. Fetch Firestore Meetings (Previous Meetings)
        const meetings = await getMeetingsFromFirestore();
        setFirestoreMeetings(meetings);

        // 3. Fetch Firestore Recordings
        const recordings = await getRecordingsFromFirestore();
        setFirestoreRecordings(recordings);

      } catch (error) {
        console.error("Error loading calls data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [client, user?.uid]);

  const now = new Date();

  // For Upcoming, we might want to blend Stream and potentially Firestore if we store future meetings there
  const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now;
  });

  // For Ended, use Firestore as the source of truth for history
  const endedCalls = firestoreMeetings;

  // For Recordings, use Firestore as requested
  const firebaseRecordings = firestoreRecordings;

  return { 
    endedCalls, 
    upcomingCalls, 
    callRecordings: calls, // Stream recordings (fallback)
    firebaseRecordings,
    isLoading 
  };
};