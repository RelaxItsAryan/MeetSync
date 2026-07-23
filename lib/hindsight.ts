// Hindsight integration disabled - stub exports to prevent import errors

export const retainMeetingMemory = async (_data: {
  userId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  analysis: any;
}): Promise<void> => {
  // no-op: Hindsight removed
};

export const recallMeetingMemory = async (_query: string, _userId: string): Promise<any[]> => {
  // no-op: Hindsight removed
  return [];
};
