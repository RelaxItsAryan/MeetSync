'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { cookies } from "next/headers";

const getUserIdFromCookie = (): string => {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('firebase-auth-token');
  if (!tokenCookie?.value) throw new Error('Unauthorized');

  const payload = JSON.parse(
    Buffer.from(tokenCookie.value.split('.')[1], 'base64').toString('utf8')
  );
  const userId: string = payload.user_id || payload.sub;
  if (!userId) throw new Error('Could not extract user ID from token');
  return userId;
};

export const saveRecordingMetadata = async (data: {
  title: string;
  videoUrl: string;
  duration: number;
}) => {
  try {
    const userId = getUserIdFromCookie();

    const docRef = await addDoc(collection(db, "recordings"), {
      title: data.title,
      videoUrl: data.videoUrl,
      duration: data.duration,
      uploadedBy: userId,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving recording metadata:", error);
    return { success: false, error: "Failed to save recording metadata" };
  }
};

export const getRecordingsFromFirestore = async () => {
  try {
    const userId = getUserIdFromCookie();

    const q = query(
      collection(db, "recordings"),
      where("uploadedBy", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const recordings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return recordings;
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return [];
  }
};
export const deleteRecordingFromFirestore = async (id: string) => {
  if (!id) return { success: false, error: "No recording ID provided" };
  try {
    const userId = getUserIdFromCookie();
    console.log(`[AUTH] User ${userId} is deleting recording ${id}`);
    
    await deleteDoc(doc(db, "recordings", id));
    
    return { success: true };
  } catch (error: any) {
    console.error("FIREBASE DELETE ERROR (Recording):", error);
    return { success: false, error: error.message || "Failed to delete recording" };
  }
};
