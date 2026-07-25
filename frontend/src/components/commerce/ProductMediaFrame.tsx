import type { ReactNode } from 'react';

type ProductMediaContext = {
  gameSlug?: string | null;
  category?: string | null;
  image?: string;
};

export function isPubgMobileProduct(product: ProductMediaContext): boolean {
  const slug = (product.gameSlug ?? product.category ?? '').toLowerCase();
  return slug === 'pubg-mobile' || Boolean(product.image?.includes('pubg-uc'));
}

export function isLocalProductArt(image?: string): boolean {
  return Boolean(image?.startsWith('/products/'));
}

export function PubgUcBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={className ? `absolute inset-0 bg-[#120c06] ${className}` : 'absolute inset-0 bg-[#120c06]'}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(251,191,36,0.35)_0%,transparent_55%)]" />
    </div>
  );
}

export function ProductMediaFrame({
  product,
  children,
  className,
}: {
  product: ProductMediaContext;
  children: ReactNode;
  className?: string;
}) {
  const isPubg = isPubgMobileProduct(product);

  return (
    <div
      className={
        className
          ? `relative aspect-16/11 overflow-hidden ${className}`
          : 'relative aspect-16/11 overflow-hidden'
      }
    >
      {isPubg ? (
        <>
          <PubgUcBackdrop />
          <div className="relative z-10 flex h-full items-center justify-center p-1.5">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
