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
    <div className="glassmorphism flex max-w-fit items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm font-normal shadow-lg backdrop-blur-md">
      <div className="size-2 animate-pulse rounded-full bg-blue-1 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
      <span className="font-medium tracking-tight text-sky-2/80">Next Meeting:</span>
      <span className="font-semibold text-white">{time}</span>
    </div>
  );



};

export default UpcomingMeetingTime;
