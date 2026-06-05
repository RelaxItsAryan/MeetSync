'use client';

import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';

import { useGetCallById } from '@/hooks/useGetCallById';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const meetingId = user?.uid;

  const { call } = useGetCallById(meetingId || '');

  if (!user) return <div className="text-white text-xl">Loading your personal room...</div>;

  const startRoom = async () => {
    if (!client || !user) {
      toast({ title: 'Connecting to meeting room...' });
      return;
    }

    const newCall = client.call('default', meetingId!);

    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });
    }

    try {
      const { saveMeetingToFirestore } = await import('@/actions/meeting.actions');
      await saveMeetingToFirestore({
        streamId: meetingId!,
        description: `${user?.displayName || user?.email}'s Personal Meeting`,
        startsAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save personal meeting to Firestore:', error);
    }

    router.push(`/meeting/${meetingId}?personal=true`);
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const meetingLink = `${baseUrl}/meeting/${meetingId}?personal=true`;

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Personal Meeting Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        <Table title="Topic" description={`${user?.displayName || user?.email}'s Meeting Room`} />
        <Table title="Meeting ID" description={meetingId!} />
        <Table title="Invite Link" description={meetingLink} />
      </div>
      <div className="flex gap-5">
        <Button className="bg-blue-1" onClick={startRoom}>
          Start Meeting
        </Button>
        <Button
          className="bg-dark-3"
          onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
        >
          Copy Invitation
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;
