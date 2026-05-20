import Image from 'next/image';
import { cn } from '@/lib/utils';

export function LummyLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className={cn('relative h-8 w-8 overflow-hidden rounded-xl flex-shrink-0', markClassName)}>
        <Image src="/lummy-logo.png" alt="Lummy" fill sizes="32px" priority className="object-contain" />
      </span>
      <span className="font-display text-xl font-bold text-current">Lummy</span>
    </span>
  );
}
