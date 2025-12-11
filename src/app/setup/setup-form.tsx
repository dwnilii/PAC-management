
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCredentials } from './actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert, CheckCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';


export function SetupForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        const result = await saveCredentials(username, password);

        if (result.success) {
            toast({
                title: "Setup Complete!",
                description: "Credentials have been saved.",
            });
            setIsSuccess(true);
        } else {
            setError(result.error || 'An unknown error occurred.');
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
               <div className="w-full max-w-sm animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
                  <Card>
                      <CardHeader className="text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                          </div>
                          <CardTitle className="text-2xl">Setup Complete!</CardTitle>
                          <CardDescription>Your application is now configured.</CardDescription>
                      </CardHeader>
                      <CardContent>
                           <Button onClick={() => router.push('/login')} className="w-full">
                              Go to Login
                           </Button>
                      </CardContent>
                  </Card>
              </div>
          </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <ShieldAlert className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">PAC-Management Setup</CardTitle>
                        <CardDescription className="animate-in fade-in slide-in-from-top-2 duration-500">
                            Welcome! Please create your admin credentials to secure the panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Admin Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Admin Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="Choose a secure password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="pt-2">
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Credentials'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
