'use client';

import React, { useEffect, useState } from 'react';

const Clock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = (new Intl.DateTimeFormat('en-US', { dateStyle: 'full' })).format(now);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-extrabold lg:text-6xl tracking-tighter leading-none">{time}</h1>
      <p className="text-lg font-semibold text-sky-1 lg:text-2xl tracking-tight opacity-90">{date}</p>
    </div>


  );
};

export default Clock;
