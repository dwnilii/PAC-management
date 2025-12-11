
'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Breadcrumb } from '@/components/breadcrumb';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SESSION_TIMEOUT_MINUTES = 15;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    if (timeoutId.current) {
        clearTimeout(timeoutId.current);
    }
    toast({ title: "Logged Out", description: "You have been logged out." });
    router.replace('/login');
  };

  const resetTimeout = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    const newTimeoutId = setTimeout(() => {
      handleLogout();
      toast({ variant: "default", title: "Session Expired", description: "You have been logged out due to inactivity." });
    }, DEFAULT_SESSION_TIMEOUT_MINUTES * 60 * 1000);
    timeoutId.current = newTimeoutId;
  };
  
  useEffect(() => {
    // Auth guard
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/login');
      return; // Stop further execution in this effect
    }

    // Set up activity listeners
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Initial timeout setup
    resetTimeout();
    
    events.forEach(event => window.addEventListener(event, resetTimeout));

    // Cleanup function
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [router]);

  // Auth guard check. If not logged in, render nothing to prevent flash of content.
  if (typeof window !== 'undefined' && sessionStorage.getItem('isLoggedIn') !== 'true') {
    return null;
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b bg-card/50 px-6 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Breadcrumb />
            </div>
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
