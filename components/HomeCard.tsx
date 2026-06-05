'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface HomeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  handleClick?: () => void;
}

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  return (
    <section
      className={cn(
        'bg-orange-1 px-6 py-8 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/5',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex-center glassmorphism size-14 rounded-xl shadow-inner">
        <Image src={img} alt="meeting" width={32} height={32} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-lg font-medium text-white/70">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;
