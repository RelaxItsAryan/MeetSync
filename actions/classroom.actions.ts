"use server";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { cookies } from "next/headers";

const getUserFromCookie = () => {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('firebase-auth-token');
    if (!tokenCookie?.value) return { userId: '', name: '' };
    const parts = tokenCookie.value.split('.');
    if (parts.length !== 3) return { userId: '', name: '' };
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    return {
      userId: payload.user_id || payload.sub || '',
      name: payload.name || payload.email?.split('@')[0] || '',
    };
  } catch {
    return { userId: '', name: '' };
  }
};

export const createClassroomDoc = async (data: { code: string; name: string }) => {
  try {
    const { userId, name: hostName } = getUserFromCookie();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await setDoc(doc(db, "classrooms", data.code), {
      code: data.code,
      name: data.name || `Classroom ${data.code}`,
      hostId: userId,
      hostName,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error creating classroom:", error);
    return { success: false, error: error.message };
  }
};

export const verifyClassroomCode = async (code: string) => {
  try {
    const docSnap = await getDoc(doc(db, "classrooms", code.toUpperCase()));
    if (!docSnap.exists()) return { exists: false };
    return { exists: true };
  } catch (error: any) {
    return { exists: false, error: error.message };
  }
};
