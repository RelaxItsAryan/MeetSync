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
    document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Strict`;
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
    <main className="flex h-screen w-full bg-white text-black font-sans overflow-hidden">
      {/* Left Column: Image */}
      <div className="relative hidden w-1/2 md:block h-screen bg-gray-100">
        <Image
          src="/images/auth.png"
          alt="Authentication Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Right Column: Form */}
      <div className="flex w-full md:w-1/2 h-screen flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 bg-white">
        <div className="mx-auto w-full max-w-[400px] flex flex-col gap-6">
          {/* Logo */}
          <div>
            <Image
              src="/icons/logo.svg"
              width={48}
              height={48}
              alt="MeetSync logo"
              className="h-12 w-auto"
            />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Sign In</h1>
            <div className="mt-4 h-px w-full bg-gray-200" />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                  className={`w-full rounded-2xl py-4 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all border ${
                    emailError
                      ? 'border-red-500 bg-[#FAF5F5]'
                      : 'border-gray-200 bg-gray-50 focus:border-gray-300 focus:bg-white'
                  }`}
                />
                {emailError && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                    <XCircle className="h-5 w-5" />
                  </span>
                )}
              </div>
              {emailError && (
                <span className="text-right text-xs italic text-red-500 mt-1 block">
                  {emailError}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                  className={`w-full rounded-2xl py-4 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all border ${
                    passwordError
                      ? 'border-red-500 bg-[#FAF5F5]'
                      : 'border-gray-200 bg-gray-50 focus:border-gray-300 focus:bg-white'
                  }`}
                />
                {passwordError && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                    <XCircle className="h-5 w-5" />
                  </span>
                )}
              </div>
              {passwordError && (
                <span className="text-right text-xs italic text-red-500 mt-1 block">
                  {passwordError}
                </span>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full border border-black bg-white py-3.5 text-center text-sm font-semibold text-black transition-all hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white py-3.5 text-sm font-semibold text-black transition-all hover:bg-gray-50 disabled:opacity-60"
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
          <div className="border-l-2 border-gray-200 pl-4 py-1 flex flex-col gap-2.5 text-sm text-gray-500">
            <div>
              Getting started?{' '}
              <a
                href="/sign-up"
                className="font-bold underline text-black hover:text-gray-700"
              >
                Create a new account
              </a>
            </div>
            <div>
              Forgot your password?{' '}
              <a
                href="#"
                className="font-bold underline text-black hover:text-gray-700"
              >
                Reset password
              </a>
            </div>
            <div>
              Need support?{' '}
              <a
                href="mailto:support@meetsync.com"
                className="font-bold underline text-black hover:text-gray-700"
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
