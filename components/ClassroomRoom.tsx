'use client';
import { useState } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { Users, LayoutList, MessageSquare, ArrowLeft } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import CallRecordingButton from './CallRecordingButton';
import ClassroomChat from './ClassroomChat';
import { cn } from '@/lib/utils';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const ClassroomRoom = ({
  classroomId,
  onLeave,
}: {
  classroomId: string;
  onLeave?: () => void;
}) => {
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid': return <PaginatedGridLayout />;
      case 'speaker-right': return <SpeakerLayout participantsBarPosition="left" />;
      default: return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden text-white flex bg-[#0d0e14]">
      {/* Main Video Area */}
      <div className="flex-1 relative flex flex-col pt-4">
        {/* Back to channel button */}
        {onLeave && (
          <button
            onClick={onLeave}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-lg px-3 py-1.5 transition-all"
          >
            <ArrowLeft size={13} />
            Back to channel
          </button>
        )}

        <div className="relative flex size-full items-center justify-center">
          <div className="flex size-full max-w-[1000px] items-center">
            <CallLayout />
          </div>
          <div
            className={cn('h-[calc(100vh-86px)] hidden ml-2', {
              'show-block': showParticipants,
            })}
          >
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        </div>

        {/* Controls */}
        <div className="fixed bottom-0 left-0 right-0 flex w-full items-center justify-center gap-4 pb-4 z-10">
          <CallControls onLeave={onLeave || (() => {})} />
          <CallRecordingButton />

          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
                <LayoutList size={20} className="text-white" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
              {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, i) => (
                <div key={i}>
                  <DropdownMenuItem onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}>
                    {item}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-dark-1" />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <CallStatsButton />

          <button onClick={() => setShowParticipants(p => !p)}>
            <div className={`cursor-pointer rounded-2xl px-4 py-2 hover:bg-[#4c535b] ${showParticipants ? 'bg-blue-1' : 'bg-[#19232d]'}`}>
              <Users size={20} className="text-white" />
            </div>
          </button>

          <button onClick={() => setShowChat(p => !p)}>
            <div className={`cursor-pointer rounded-2xl px-4 py-2 hover:bg-[#4c535b] ${showChat ? 'bg-blue-1' : 'bg-[#19232d]'}`}>
              <MessageSquare size={20} className="text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-80 h-full border-l border-white/5 shrink-0 bg-[#13151f] z-20">
          <ClassroomChat classroomId={classroomId} />
        </div>
      )}
    </section>
  );
};

export default ClassroomRoom;
