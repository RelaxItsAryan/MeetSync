'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoaded: false });

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize synchronously from Firebase's cached currentUser (instant, no network)
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoaded(true);

      if (firebaseUser) {
        // Set/Refresh the auth cookie
        const token = await firebaseUser.getIdToken();
        document.cookie = `firebase-auth-token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        // Clear cookie on sign out
        document.cookie = 'firebase-auth-token=; path=/; max-age=0';
      }
    });

    // Fallback: check currentUser immediately after mount
    if (auth.currentUser) {
      setUser(auth.currentUser);
      setIsLoaded(true);
    }

    // Auto-refresh token every 40 mins (Firebase tokens last 1 hour)
    const refreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        document.cookie = `firebase-auth-token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }, 40 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseUser = () => useContext(AuthContext);
