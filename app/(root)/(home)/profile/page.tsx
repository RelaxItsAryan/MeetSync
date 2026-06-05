'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';

const ProfilePage = () => {
  const { user } = useFirebaseUser();
  const { toast } = useToast();
  const [name, setName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  if (!user) return <Loader />;

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(user, { displayName: name });
      toast({ title: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold lg:text-4xl px-2 py-1">User Profile</h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12 glassmorphism p-8 rounded-2xl border border-dark-3 w-full max-w-4xl">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-32 rounded-full overflow-hidden border-4 border-blue-1 ring-4 ring-blue-1/20 shadow-2xl">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="size-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0E78F9&color=fff&size=128`;
                }}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-blue-1 text-4xl font-bold text-white">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-sky-2 text-sm">Profile Picture</p>
        </div>

        {/* Info Section */}
        <div className="flex flex-1 flex-col gap-6">
          <form onSubmit={handleUpdate} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sky-2 text-sm font-medium">Display Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg bg-dark-3 px-4 py-3 text-white placeholder:text-gray-500 outline-none border border-transparent focus:border-blue-1 transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sky-2 text-sm font-medium">Email Address</label>
              <input 
                type="email" 
                value={user.email || ''} 
                disabled 
                className="rounded-lg bg-dark-2 px-4 py-3 text-gray-400 cursor-not-allowed border border-dark-3"
              />
              <p className="text-xs text-dark-4">Email cannot be changed here.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sky-2 text-sm font-medium">User ID</label>
              <code className="rounded-lg bg-dark-3/50 p-3 text-xs text-sky-1 font-mono break-all border border-dark-3">
                {user.uid}
              </code>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-fit rounded-lg bg-blue-1 px-8 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 shadow-lg shadow-blue-1/20"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Account Stats / Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="glassmorphism p-6 rounded-xl border border-dark-3 flex flex-col gap-1">
          <p className="text-sky-2 text-xs uppercase tracking-wider font-bold">Account Created</p>
          <p className="text-lg font-semibold">{new Date(user.metadata.creationTime!).toLocaleDateString()}</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl border border-dark-3 flex flex-col gap-1">
          <p className="text-sky-2 text-xs uppercase tracking-wider font-bold">Last Sign-in</p>
          <p className="text-lg font-semibold">{new Date(user.metadata.lastSignInTime!).toLocaleDateString()}</p>
        </div>
        <div className="glassmorphism p-6 rounded-xl border border-dark-3 flex flex-col gap-1">
          <p className="text-sky-2 text-xs uppercase tracking-wider font-bold">Provider</p>
          <p className="text-lg font-semibold capitalize">{user.providerData[0]?.providerId.split('.')[0] || 'Email'}</p>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
