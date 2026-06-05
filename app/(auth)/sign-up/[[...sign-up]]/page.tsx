'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuthCookie = async (user: import('firebase/auth').User) => {
    const token = await user.getIdToken();
    document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Strict`;
  };

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      await setAuthCookie(result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setAuthCookie(result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-dark-2">
      <div className="w-full max-w-md rounded-2xl border border-dark-3 bg-dark-1 p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Image src="/icons/logo.svg" width={48} height={48} alt="MeetSync logo" />
          <h1 className="text-2xl font-extrabold text-white">Create account</h1>
          <p className="text-sm text-sky-2">Join MeetSync today</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-sky-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg bg-dark-3 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-blue-1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-sky-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="rounded-lg bg-dark-3 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-blue-1"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-sky-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min. 6 characters"
              className="rounded-lg bg-dark-3 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-blue-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-blue-1 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-dark-3" />
          <span className="text-sm text-sky-2">or</span>
          <div className="h-px flex-1 bg-dark-3" />
        </div>

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-3 bg-dark-3 py-3 font-medium text-white transition hover:bg-dark-4 disabled:opacity-60"
        >
          <Image src="/icons/google.svg" width={20} height={20} alt="Google" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          Continue with Google
        </button>

        {/* Sign In link */}
        <p className="mt-6 text-center text-sm text-sky-2">
          Already have an account?{' '}
          <a href="/sign-in" className="font-semibold text-blue-1 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
