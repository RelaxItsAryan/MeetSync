'use client';

import { useEffect, useState } from 'react';
import { getMeetingsFromFirestore } from '@/actions/meeting.actions';
import MeetingCard from './MeetingCard';
import Loader from './Loader';

const MeetingHistory = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      const data = await getMeetingsFromFirestore();
      setMeetings(data);
      setIsLoading(false);
    };

    fetchMeetings();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {meetings.length > 0 ? (
        meetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            icon="/icons/previous.svg"
            title={meeting.description || 'No Description'}
            date={meeting.startsAt ? new Date(meeting.startsAt).toLocaleString() : 'N/A'}
            isPreviousMeeting={true}
            link={`${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.streamId}`}
            buttonIcon1={undefined}
            buttonText="Start"
            handleClick={() => window.location.href = `/meeting/${meeting.streamId}`}
          />
        ))
      ) : (
        <h1 className="text-2xl font-bold text-white">No Meeting History</h1>
      )}
    </div>
  );
};

export default MeetingHistory;
