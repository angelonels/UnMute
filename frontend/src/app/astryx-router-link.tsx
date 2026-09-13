import { Link } from '@tanstack/react-router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type AstryxRouterLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export function AstryxRouterLink({ href, children, ...rest }: AstryxRouterLinkProps) {
  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  );
}
