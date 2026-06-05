'use client';

import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';

const Greeting = () => {
  const { user, isLoaded } = useFirebaseUser();

  if (!isLoaded) return <div className="h-10 w-48 animate-pulse bg-dark-3 rounded-lg" />;

  const name = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <h1 className="text-3xl font-extrabold lg:text-5xl text-white tracking-tight mb-2">
      Welcome back, {name}!
    </h1>
  );
};

export default Greeting;
