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
    <div className="glassmorphism max-w-fit rounded px-3 py-1.5 text-sm font-normal flex items-center gap-2 border border-white/10 shadow-lg">
      <div className="size-1.5 rounded-full bg-orange-1 animate-pulse shadow-glow" />
      <span className="text-sky-2/80 font-medium tracking-tight">Next Meeting:</span>
      <span className="font-semibold text-white">{time}</span>
    </div>
  );



};

export default UpcomingMeetingTime;
