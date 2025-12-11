
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/ou', label: 'OUs' },
    { href: '/dashboard/users', label: 'Users' },
    { href: '/dashboard/proxy', label: 'Proxy' },
    { href: '/dashboard/nginx', label: 'Nginx' },
    { href: '/dashboard/setting', label: 'Setting' },
    { href: '/dashboard/update', label: 'Update' },
    { href: '/dashboard/backup-restore', label: 'Backup & Restore' },
  ];

  return (
    <nav aria-label="breadcrumb" className="hidden md:flex items-center space-x-2 text-sm">
      {segments.length > 0 && (
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
      )}
      {segments.slice(1).map((segment, index) => {
        const href = `/${segments.slice(0, index + 2).join('/')}`;
        const isLast = index === segments.length - 2;
        const navItem = navItems.find(item => item.href === href);
        const label = navItem ? navItem.label : capitalize(segment.replace(/-/g, ' '));

        return (
          <Fragment key={href}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              href={href}
              className={
                isLast
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }
              aria-current={isLast ? 'page' : undefined}
            >
              {label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
