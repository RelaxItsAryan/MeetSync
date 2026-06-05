'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';

import MobileNav from './MobileNav';

const Navbar = () => {
  const { user, isLoaded } = useFirebaseUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    document.cookie = 'firebase-auth-token=; path=/; max-age=0';
    router.push('/sign-in');
  };

  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-1">
        <img
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="MeetSync logo"
          className="max-sm:size-10"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          MeetSync
        </p>
      </Link>

      <div className="flex-between gap-5">
        {!isLoaded ? (
          <div className="size-9 rounded-full bg-dark-3 animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full overflow-hidden border-2 border-blue-1 hover:border-blue-400 transition cursor-pointer shadow-lg">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      width={36}
                      height={36}
                      alt={user.displayName || 'User'}
                      className="rounded-full object-cover size-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=0E78F9&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-blue-1 text-white font-bold text-sm">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-dark-2 border-dark-3 text-white">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-sky-2 truncate max-w-[180px]">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-dark-3 focus:text-white"
                onClick={() => router.push('/profile')}
              >
                <User className="mr-2 size-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-dark-3 focus:text-white"
                onClick={() => router.push('/personal-room')}
              >
                <Settings className="mr-2 size-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
