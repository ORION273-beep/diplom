import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface/90 p-6 shadow-lg shadow-black/30 backdrop-blur-sm md:p-8">
        <div className="mb-6">
          <Logo className="mb-4" />
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </section>
  );
}
