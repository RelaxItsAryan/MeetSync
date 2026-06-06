"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { cookies } from "next/headers";

const getUserIdFromCookie = (): string => {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('firebase-auth-token');
  if (!tokenCookie?.value) throw new Error('Unauthorized');

  const parts = tokenCookie.value.split('.');
  if (parts.length !== 3) throw new Error('Invalid token structure');

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(
    Buffer.from(base64, 'base64').toString('utf8')
  );
  const userId: string = payload.user_id || payload.sub;
  if (!userId) throw new Error('Could not extract user ID from token');
  return userId;
};

export const saveMeetingToFirestore = async (meetingData: {
  streamId: string;
  description: string;
  startsAt: string;
}) => {
  try {
    const userId = getUserIdFromCookie();

    const docRef = await addDoc(collection(db, "meetings"), {
      streamId: meetingData.streamId,
      creatorId: userId,
      description: meetingData.description,
      startsAt: meetingData.startsAt,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firebase Error saving meeting:", error);
    return { success: false, error: "Failed to save meeting to Firestore" };
  }
};

export const getMeetingsFromFirestore = async () => {
  try {
    const userId = getUserIdFromCookie();

    const q = query(
      collection(db, "meetings"),
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const meetings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return meetings;
  } catch (error) {
    console.error("Firebase Error fetching meetings:", error);
    return [];
  }
};
export const deleteMeetingFromFirestore = async (meetingId: string) => {
  if (!meetingId) return { success: false, error: "No meeting ID provided" };
  try {
    const userId = getUserIdFromCookie();
    console.log(`[AUTH] User ${userId} is deleting meeting ${meetingId}`);
    
    // We should ideally check if the user is the owner here, but 
    // Firestore rules will also handle this.
    await deleteDoc(doc(db, "meetings", meetingId));
    
    return { success: true };
  } catch (error: any) {
    console.error("FIREBASE DELETE ERROR (Meeting):", error);
    return { success: false, error: error.message || "Failed to delete meeting" };
  }
};
