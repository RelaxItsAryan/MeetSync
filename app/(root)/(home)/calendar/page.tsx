'use client';

import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from '@/components/MeetingCard';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import Loader from '@/components/Loader';
import MeetingModal from '@/components/MeetingModal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { saveMeetingToFirestore } from '@/actions/meeting.actions';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState(new Date());
  const { callRecordings: calls, isLoading } = useGetCalls();
  const { toast } = useToast();
  const { user } = useFirebaseUser();
  const client = useStreamVideoClient();

  const createMeeting = async () => {
    if (!client || !user) return;
    try {
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');
      
      const startsAt = meetingTime.toISOString();
      const desc = description || 'Scheduled Meeting';
      
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: { description: desc },
        },
      });

      await saveMeetingToFirestore({
        streamId: call.id,
        description: desc,
        startsAt,
      });

      toast({ title: 'Meeting Created' });
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  if (isLoading) return <Loader />;

  const filteredMeetings = calls?.filter((meeting: Call) => {
    const meetingDate = new Date(meeting.state.startsAt!);
    return (
      meetingDate.getDate() === selectedDate.getDate() &&
      meetingDate.getMonth() === selectedDate.getMonth() &&
      meetingDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const meetingDates = calls
    ?.map((m) => new Date(m.state.startsAt!))
    .filter((d) => !isNaN(d.getTime()));

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-1 px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Schedule Meeting
        </button>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="calendar-container glassmorphism p-5 rounded-[14px] flex flex-col items-center">
          <ReactDatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date || new Date());
              setMeetingTime(date || new Date());
            }}
            inline
            highlightDates={meetingDates}
            calendarClassName="custom-calendar"
          />
        </div>

        <div className="flex flex-1 flex-col gap-5">
          <h2 className="text-2xl font-semibold">
            Meetings on {selectedDate.toDateString()}
          </h2>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredMeetings && filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting: Call) => (
                <MeetingCard
                  key={meeting.id}
                  icon="/icons/upcoming.svg"
                  title={meeting.state?.custom?.description || 'No Description'}
                  date={new Date(meeting.state.startsAt!).toLocaleString()}
                  isPreviousMeeting={new Date(meeting.state.startsAt!) < new Date()}
                  link={`${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.id}`}
                  buttonText="Start"
                  handleClick={() => { window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.id}`); }}

                />
              ))
            ) : (
              <p className="text-sky-1">No meetings scheduled for this day.</p>
            )}
          </div>
        </div>
      </div>

      <MeetingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule a Meeting"
        handleClick={createMeeting}
      >
        <div className="flex flex-col gap-2.5">
          <label className="text-base font-normal text-sky-2">Add a description</label>
          <Textarea 
            className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="text-base font-normal text-sky-2">Select Time</label>
          <ReactDatePicker
            selected={meetingTime}
            onChange={(date) => setMeetingTime(date!)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            className="w-full rounded bg-dark-3 p-2 focus:outline-none text-white"
          />
        </div>
      </MeetingModal>


      <style jsx global>{`
        .custom-calendar {
          background-color: transparent !important;
          border: none !important;
          color: white !important;
          font-family: inherit !important;
        }
        .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker__day {
          color: white !important;
        }
        .react-datepicker__day:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .react-datepicker__day--selected {
          background-color: #0E78F9 !important;
          border-radius: 4px !important;
        }
        .react-datepicker__day--highlighted {
          background-color: #1a1b1f !important;
          border: 1px solid #0E78F9 !important;
          color: white !important;
        }
        .react-datepicker__navigation--previous,
        .react-datepicker__navigation--next {
          top: 15px !important;
        }
      `}</style>
    </section>
  );
};

export default CalendarPage;
