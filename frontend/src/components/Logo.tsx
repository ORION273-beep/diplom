import { Link } from 'react-router-dom';

type LogoProps = {
  className?: string;
  href?: string;
  showTagline?: boolean;
};

export function Logo({ className, href = '/', showTagline = false }: LogoProps) {
  const content = (
    <span className={className ? `inline-flex flex-col ${className}` : 'inline-flex flex-col'}>
      <span className="text-xl font-bold tracking-tight text-fg">
        One<span className="text-emerald-400">Sec</span>
      </span>
      {showTagline && <span className="text-xs font-normal text-muted">Пополнение сервисов</span>}
    </span>
  );

  if (href) {
    return (
      <Link to={href} className="shrink-0 outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
