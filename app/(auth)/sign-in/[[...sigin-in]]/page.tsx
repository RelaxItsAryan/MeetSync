'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, XCircle } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const setAuthCookie = async (user: import('firebase/auth').User) => {
    const token = await user.getIdToken();
    document.cookie = `firebase-auth-token=${token}; path=/; max-age=2592000; SameSite=Lax`;
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email) {
      setEmailError('Please enter an email address');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter a password');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await setAuthCookie(result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setAuthCookie(result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full bg-dark-2 text-white font-sans overflow-hidden">
      {/* Left Column: Image */}
      <div className="relative hidden w-1/2 md:flex h-screen bg-dark-1 items-center justify-center overflow-hidden">
        <Image
          src="/images/auth.png"
          alt="Authentication Background"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        {/* Bottom overlay text */}
        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent z-10">
          <p className="text-2xl font-bold text-white tracking-tight">MeetSync</p>
          <p className="text-sm text-zinc-400 mt-1">Seamlessly connect, collaborate, and communicate.</p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex w-full md:w-1/2 h-screen flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 xl:px-28 bg-dark-2">
        <div className="mx-auto w-full max-w-[400px] flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/icons/logo.svg"
              width={40}
              height={40}
              alt="MeetSync logo"
            />
            <span className="text-xl font-bold text-white tracking-tight">MeetSync</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-zinc-400 mt-2 text-sm">Sign in to your account to continue</p>
            <div className="mt-4 h-px w-full bg-white/10" />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Your email"
                  className={`w-full rounded-2xl py-4 pl-12 pr-12 text-sm text-white placeholder:text-zinc-600 outline-none transition-all border bg-dark-3 ${
                    emailError
                      ? 'border-red-500/50'
                      : 'border-white/10 focus:border-blue-1/60 focus:bg-dark-4'
                  }`}
                />
                {emailError && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400">
                    <XCircle className="h-5 w-5" />
                  </span>
                )}
              </div>
              {emailError && (
                <span className="text-right text-xs italic text-red-400 mt-1 block">
                  {emailError}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Your password"
                  className={`w-full rounded-2xl py-4 pl-12 pr-12 text-sm text-white placeholder:text-zinc-600 outline-none transition-all border bg-dark-3 ${
                    passwordError
                      ? 'border-red-500/50'
                      : 'border-white/10 focus:border-blue-1/60 focus:bg-dark-4'
                  }`}
                />
                {passwordError && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400">
                    <XCircle className="h-5 w-5" />
                  </span>
                )}
              </div>
              {passwordError && (
                <span className="text-right text-xs italic text-red-400 mt-1 block">
                  {passwordError}
                </span>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-blue-1 py-4 text-center text-sm font-semibold text-white transition-all hover:bg-blue-1/90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-dark-3 py-4 text-sm font-semibold text-white transition-all hover:bg-dark-4 active:scale-[0.98] disabled:opacity-60"
          >
            <Image
              src="/icons/google.svg"
              width={20}
              height={20}
              alt="Google logo"
            />
            Continue with Google
          </button>

          {/* Links Block */}
          <div className="border-l-2 border-white/10 pl-4 py-1 flex flex-col gap-2.5 text-sm text-zinc-500">
            <div>
              Getting started?{' '}
              <a
                href="/sign-up"
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Create a new account
              </a>
            </div>
            <div>
              Forgot your password?{' '}
              <a
                href="#"
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reset password
              </a>
            </div>
            <div>
              Need support?{' '}
              <a
                href="mailto:support@meetsync.com"
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Send us an email
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
