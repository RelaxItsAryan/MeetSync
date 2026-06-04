import MeetingTypeList from '@/components/MeetingTypeList';
import Clock from '@/components/Clock';
import UpcomingMeetingTime from '@/components/UpcomingMeetingTime';
import { currentUser } from '@clerk/nextjs/server';

const Home = async () => {
  const user = await currentUser();


  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <div className="flex flex-col gap-2">
            <h2 className="glassmorphism max-w-[273px] rounded py-2 text-center text-base font-normal">
              Welcome back, {user?.firstName || 'User'}!
            </h2>
            <UpcomingMeetingTime />

          </div>
          <Clock />

        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
};

export default Home;
