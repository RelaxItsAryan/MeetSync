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
    <div className="glassmorphism flex max-w-fit items-center gap-2 rounded border border-white/10 px-3 py-1.5 text-sm font-normal shadow-lg">
      <div className="size-1.5 animate-pulse rounded-full bg-orange-1" />
      <span className="font-medium tracking-tight text-sky-2/80">Next Meeting:</span>
      <span className="font-semibold text-white">{time}</span>
    </div>
  );



};

export default UpcomingMeetingTime;
