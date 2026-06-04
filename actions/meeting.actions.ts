"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { currentUser } from "@clerk/nextjs/server";

export const saveMeetingToFirestore = async (meetingData: {
  streamId: string;
  description: string;
  startsAt: string;
}) => {
  try {
    const user = await currentUser();
    if (!user) {
      console.error("Unauthorized: No user found");
      return { success: false, error: "Unauthorized" };
    }

    const docRef = await addDoc(collection(db, "meetings"), {
      streamId: meetingData.streamId,
      creatorId: user.id,
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
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const { getDocs, query, collection, where, orderBy } = await import("firebase/firestore");
    
    const q = query(
      collection(db, "meetings"),
      where("creatorId", "==", user.id),
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
