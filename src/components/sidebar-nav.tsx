
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Network,
  Settings,
  DatabaseBackup,
  LogOut,
  Building2,
  ShieldCheck,
  Server,
  Users,
  GitPullRequest,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/ou', icon: Building2, label: 'OUs' },
  { href: '/dashboard/users', icon: Users, label: 'Users' },
  { href: '/dashboard/proxy', icon: Network, label: 'Proxy' },
  { href: '/dashboard/nginx', icon: Server, label: 'Nginx' },
  { href: '/dashboard/update', icon: GitPullRequest, label: 'Update' },
  { href: '/dashboard/backup-restore', icon: DatabaseBackup, label: 'Backup & Restore' },
  { href: '/dashboard/setting', icon: Settings, label: 'Setting' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    router.replace('/login');
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 h-16 w-full px-4">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
            <span className="whitespace-nowrap text-lg font-semibold">PAC-Management</span>
        </div>
      </SidebarHeader>
      <SidebarGroup className="flex-1">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                  tooltip={item.label}
                  size="sm"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton onClick={handleLogout} tooltip="Logout" size="sm" variant="destructive">
               <LogOut />
               <span>Logout</span>
             </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
         <p className="sidebar-credit text-xs text-muted-foreground text-center pt-2 px-4 whitespace-nowrap">
            Created by Danial Khandan
        </p>
      </SidebarFooter>
    </>
  );
}
