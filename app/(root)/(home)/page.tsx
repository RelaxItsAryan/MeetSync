import MeetingTypeList from '@/components/MeetingTypeList';
import Clock from '@/components/Clock';
import UpcomingMeetingTime from '@/components/UpcomingMeetingTime';
import Greeting from '@/components/Greeting';

const Home = () => {
  return (
    <section className="flex size-full flex-col gap-4 text-white">
      <Greeting />

      <div className="h-[280px] w-full rounded-[28px] bg-hero bg-cover overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 bg-black/20" /> {/* Darker overlay for better text readability */}
        <div className="relative flex h-full flex-col justify-between max-md:px-5 max-md:py-6 lg:p-10 z-10">
          <div className="glassmorphism w-fit px-4 py-2 rounded-xl border border-white/10">
            <UpcomingMeetingTime />
          </div>
          <div className="flex flex-col gap-2">
            <Clock />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
        <MeetingTypeList />
      </div>
    </section>
  );
};

export default Home;
