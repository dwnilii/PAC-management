'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, GitPullRequest, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UpdatePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [updateLog, setUpdateLog] = useState<string>('');
    const { toast } = useToast();

    const handleUpdate = async () => {
        setIsLoading(true);
        setUpdateLog('Starting update process...\n');

        try {
            const response = await fetch('/api/update', {
                method: 'POST',
            });

            if (!response.body) {
                 throw new Error("The response body is empty.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setUpdateLog(prev => prev + chunk);
            }

            if (!response.ok) {
                 const errorText = 'Update script finished with an error.';
                 setUpdateLog(prev => prev + `\nERROR: ${errorText}\n`);
                 toast({ variant: 'destructive', title: 'Update Failed', description: errorText });
            } else {
                 setUpdateLog(prev => prev + '\nUpdate process completed successfully!\n');
                 toast({ title: 'Update Successful', description: 'The application has been updated.' });
            }

        } catch (error: any) {
            const errorMessage = error.message || 'An unknown error occurred during the update.';
            setUpdateLog(prev => prev + `\nFATAL ERROR: ${errorMessage}\n`);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <GitPullRequest className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Application Update</CardTitle>
                            <CardDescription>
                                Update the application to the latest version from the GitHub repository.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                            <p>This process will pull the latest code, install dependencies, and restart the application server. Your database and `.env` file will not be affected.</p>
                            <p className="mt-2">Ensure you have a backup before proceeding. Do not close this browser window during the update process.</p>
                        </AlertDescription>
                    </Alert>
                    
                    <Button onClick={handleUpdate} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Updating...' : 'Start Update'}
                    </Button>
                </CardContent>
            </Card>

            {updateLog && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Update Log</CardTitle>
                        <CardDescription>Live output from the update process.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72 w-full rounded-md border">
                             <pre className="p-4 text-xs font-mono bg-muted text-muted-foreground rounded-lg overflow-x-auto">
                                <code>{updateLog}</code>
                            </pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}