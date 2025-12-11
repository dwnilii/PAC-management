
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BarChart, Users, Network, GitBranch, Building2, UserPlus, ArrowRight, AlertTriangle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    proxies: 0,
    ous: 0,
    users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [proxiesRes, ousRes, usersRes] = await Promise.all([
          fetch('/api/proxies'),
          fetch('/api/ous'),
          fetch('/api/users'),
        ]);

        const proxiesData = await proxiesRes.json();
        const ousData = await ousRes.json();
        const usersData = await usersRes.json();
        
        setStats({
          proxies: proxiesData.length,
          ous: ousData.length,
          users: usersData.length,
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-80" />
        </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Proxies
            </CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proxies}</div>
            <p className="text-xs text-muted-foreground">
              Configured in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organizational Units
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ous}</div>
            <p className="text-xs text-muted-foreground">
              Total organizational units created
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              Total users created
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Welcome to PAC-Management</CardTitle>
            <CardDescription>A centralized panel for generating and managing Proxy Auto-Config (PAC) files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className='prose prose-invert max-w-none'>
                <p>This panel allows you to dynamically create and manage PAC files for different organizational units (OUs) or individual users. PAC files are JavaScript files that instruct a web browser how to handle web requests, either by sending them through a specific proxy server or by connecting directly.</p>
                <h3 className='text-foreground'>How It Works:</h3>
                <ol>
                    <li><strong>Define Proxies:</strong> In the "Proxy" section, you can define all the proxy servers you want to use.</li>
                    <li><strong>Create OUs or Users:</strong> In the "OUs" or "Users" sections, you create entities. For each entity, you can:
                        <ul>
                            <li>Assign a specific proxy.</li>
                            <li>Set a routing mode: either proxy all traffic except a "bypass list," or go direct for all traffic except a "proxy list."</li>
                            <li>Define the list of domains for your chosen mode.</li>
                        </ul>
                    </li>
                    <li><strong>PAC File Generation:</strong> When you create or update an OU or a User, the system automatically generates a corresponding `.pac` file.</li>
                    <li><strong>Deployment:</strong> These PAC files are saved to a specific directory on your server (`/var/www/html/pac/`). You can then configure your users' browsers or systems to use the URL pointing to their respective PAC file.</li>
                </ol>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
