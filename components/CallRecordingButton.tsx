'use client';

import React, { useState, useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { Circle, Square, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

const CallRecordingButton = () => {
  const call = useCall();
  const { useIsCallRecordingInProgress } = useCallStateHooks();
  const isRecording = useIsCallRecordingInProgress();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // When the recording state finally cycles, stop the loading state
    setIsTransitioning(false);
  }, [isRecording]);

  const toggleRecording = async () => {
    if (!call) return;
    setIsTransitioning(true);
    
    try {
      if (isRecording) {
        await call.stopRecording();
        toast({ title: 'Recording stopped. It will appear in your history shortly.' });
      } else {
        await call.startRecording();
        toast({ title: 'Recording started' });
      }
    } catch (error) {
      console.error('Failed to toggle recording:', error);
      toast({ title: 'Failed to toggle recording', variant: 'destructive' });
      setIsTransitioning(false);
    }
  };

  return (
    <Button
      onClick={toggleRecording}
      disabled={isTransitioning}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2 transition-all ${
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-[#19232d] hover:bg-[#4c535b] text-white'
      }`}
    >
      {isTransitioning ? (
        <Loader2 className="size-5 animate-spin" />
      ) : isRecording ? (
        <>
          <Square className="size-5 fill-white" />
          <span className="font-bold">STOP REC</span>
        </>
      ) : (
        <>
          <Circle className="size-5 fill-red-500 text-red-500" />
          <span className="font-medium">RECORD</span>
        </>
      )}
    </Button>
  );
};

export default CallRecordingButton;
