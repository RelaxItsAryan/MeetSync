import MeetingTypeList from '@/components/MeetingTypeList';
import Clock from '@/components/Clock';
import UpcomingMeetingTime from '@/components/UpcomingMeetingTime';
import Greeting from '@/components/Greeting';

const Home = () => {
  return (
    <section className="flex size-full flex-col gap-4 text-white">
      <Greeting />

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
