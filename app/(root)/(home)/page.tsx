import MeetingTypeList from '@/components/MeetingTypeList';
import Clock from '@/components/Clock';
import UpcomingMeetingTime from '@/components/UpcomingMeetingTime';
import { currentUser } from '@clerk/nextjs/server';

const Home = async () => {
  const user = await currentUser();


  return (
    <section className="flex size-full flex-col gap-4 text-white">
      <h1 className="text-3xl font-extrabold lg:text-5xl bg-gradient-to-r from-white to-sky-1 bg-clip-text text-transparent animate-in fade-in duration-700">
        Welcome back, {user?.firstName || 'User'}!
      </h1>

      <div className="h-[220px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-6 lg:p-8">
          <div className="flex flex-col gap-2">
            <UpcomingMeetingTime />
          </div>
          <Clock />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
        <MeetingTypeList />
      </div>
    </section>
  );
};

export default Home;
