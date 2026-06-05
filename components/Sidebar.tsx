'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col justify-between glassmorphism2 p-6 pt-24 text-white max-sm:hidden lg:w-[264px] border-r border-white/5">
      <div className="flex flex-1 flex-col gap-6">
        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'flex gap-4 items-center p-4 rounded-xl justify-start transition-all duration-200 hover:bg-white/5',
                {
                  'bg-blue-1 shadow-lg': isActive,
                }
              )}
            >
              <Image
                src={item.imgURL}
                alt={item.label}
                width={24}
                height={24}
                className="brightness-0 invert"
              />
              <p className={cn("text-lg font-semibold max-lg:hidden", {
                "text-white": isActive,
                "text-zinc-400": !isActive
              })}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default Sidebar;
