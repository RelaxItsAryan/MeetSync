'use client';

import { useGetCalls } from '@/hooks/useGetCalls';
import React from 'react';

const UpcomingMeetingTime = () => {
  const { upcomingCalls } = useGetCalls();

  const nextMeeting = upcomingCalls && upcomingCalls.length > 0 
    ? upcomingCalls.sort((a, b) => 
        new Date(a.state.startsAt!).getTime() - new Date(b.state.startsAt!).getTime()
      )[0] 
    : null;

  const time = nextMeeting?.state?.startsAt 
    ? new Date(nextMeeting.state.startsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'No upcoming meetings';

  return (
    <h2 className="glassmorphism max-w-[273px] rounded py-2 text-center text-base font-normal">
      Upcoming Meeting at: {time}
    </h2>
  );
};

export default UpcomingMeetingTime;
