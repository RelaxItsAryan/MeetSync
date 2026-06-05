'use client';

import { useState } from 'react';
import CallList from '@/components/CallList';
import RecordingUploadModal from '@/components/RecordingUploadModal';

const PreviousPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recordings</h1>
        <RecordingUploadModal onSuccess={() => setRefreshKey((prev) => prev + 1)} />
      </div>

      <CallList type="recordings" key={refreshKey} />
    </section>
  );
};

export default PreviousPage;
