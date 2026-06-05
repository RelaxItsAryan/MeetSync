'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';
import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, firebaseRecordings, isLoading } =
    useGetCalls();
  const [streamRecordings, setStreamRecordings] = useState<CallRecording[]>([]);

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        // Blend Firebase recordings and Stream recordings if needed, 
        // but the user primarily wants Firebase.
        return [...(firebaseRecordings || []), ...streamRecordings];
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchStreamRecordings = async () => {
      try {
        const callData = await Promise.all(
          callRecordings?.map((meeting) => meeting.queryRecordings()) ?? [],
        );

        const recordings = callData
          .filter((call) => call.recordings.length > 0)
          .flatMap((call) => call.recordings);

        setStreamRecordings(recordings);
      } catch (error) {
        console.error("Error fetching stream recordings:", error);
      }
    };

    if (type === 'recordings') {
      fetchStreamRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: any) => {
          // Determine data source and format props for MeetingCard
          let cardProps = {
            id: meeting.id || meeting.streamId,
            icon: '',
            title: '',
            date: '',
            link: '',
            buttonIcon1: undefined as string | undefined,
            buttonText: 'Start',
            isPreviousMeeting: type === 'ended',
          };

          if (type === 'recordings') {
            cardProps.icon = '/icons/recordings.svg';
            cardProps.buttonIcon1 = '/icons/play.svg';
            cardProps.buttonText = 'Play';
            
            // if it's a Firebase recording
            if (meeting.videoUrl) {
              cardProps.title = meeting.title;
              cardProps.date = meeting.createdAt?.toDate ? meeting.createdAt.toDate().toLocaleString() : new Date(meeting.createdAt).toLocaleString();
              cardProps.link = meeting.videoUrl;
            } else {
              // it's a Stream recording
              cardProps.title = (meeting as CallRecording).filename?.substring(0, 20) || 'No Description';
              cardProps.date = new Date((meeting as CallRecording).start_time).toLocaleString();
              cardProps.link = (meeting as CallRecording).url;
            }
          } else if (type === 'ended') {
            cardProps.icon = '/icons/previous.svg';
            // if it's a Firestore meeting
            if (meeting.description) {
              cardProps.title = meeting.description;
              cardProps.date = new Date(meeting.startsAt).toLocaleString();
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
              cardProps.link = `${baseUrl}/meeting/${meeting.streamId}`;
            }
          } else {
            // upcoming (Stream Call object)
            cardProps.icon = '/icons/upcoming.svg';
            cardProps.title = (meeting as Call).state?.custom?.description || 'No Description';
            cardProps.date = (meeting as Call).state?.startsAt?.toLocaleString() || '';
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
            cardProps.link = `${baseUrl}/meeting/${(meeting as Call).id}`;
          }

          return (
            <MeetingCard
              key={cardProps.id}
              icon={cardProps.icon}
              title={cardProps.title}
              date={cardProps.date}
              isPreviousMeeting={cardProps.isPreviousMeeting}
              link={cardProps.link}
              buttonIcon1={cardProps.buttonIcon1}
              buttonText={cardProps.buttonText}
              handleClick={() => {
                if (type === 'recordings') {
                   window.open(cardProps.link, '_blank');
                } else {
                   router.push(`/meeting/${meeting.id || meeting.streamId}`);
                }
              }}
            />
          );
        })
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
