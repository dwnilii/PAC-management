
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, Save, Terminal, FolderCheck, FileWarning, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateCredentials } from './actions';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

type PacDirStatus = 'loading' | 'exists' | 'not_found' | 'permission_denied' | 'error';

const defaultSettings = {
    sessionTimeoutMinutes: 15,
};

export default function SettingPage() {
    const router = useRouter();
    const [allSettings, setAllSettings] = useState<any>(defaultSettings);
    const [currentUsername, setCurrentUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [pacDirStatus, setPacDirStatus] = useState<PacDirStatus>('loading');
    const [pacDirError, setPacDirError] = useState('');
    const [isCreatingDir, setIsCreatingDir] = useState(false);

    const checkPacDirectory = async () => {
        setPacDirStatus('loading');
        setPacDirError('');
        try {
            const response = await fetch('/api/settings/pac-directory');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to check directory status.');
            }
            setPacDirStatus(data.status);
            if(data.error) setPacDirError(data.error);

        } catch (error: any) {
            setPacDirStatus('error');
            setPacDirError(error.message);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const settings = await response.json();
                    setAllSettings((prev: any) => ({...prev, ...settings}) );
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };
        fetchSettings();
        checkPacDirectory();
    }, []);

    const handleCreateDirectory = async () => {
        setIsCreatingDir(true);
        try {
            const response = await fetch('/api/settings/pac-directory', { method: 'POST' });
            const result = await response.json();
             if (!response.ok) {
                throw new Error(result.error || 'Failed to create directory.');
            }
            toast({ title: 'Success!', description: result.message });
            await checkPacDirectory();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsCreatingDir(false);
        }
    }

    const handleSettingChange = (key: string, value: any) => {
        setAllSettings((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allSettings)
            });
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.error || 'Failed to save settings.');
            }
            toast({ title: 'Success!', description: result.message || 'Settings have been saved successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCredentialChange = async () => {
        setIsSaving(true);
        try {
            if (newPassword !== confirmPassword) {
                throw new Error('New password and confirmation password do not match.');
            }
             if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
                throw new Error('All credential fields are required.');
            }

            const result = await updateCredentials({ currentUsername, currentPassword, newUsername, newPassword });
            
            if (result && result.error) {
                throw new Error(result.error);
            }

            toast({ title: 'Success!', description: result.message });

            // Log the user out after changing password
            setTimeout(() => {
                sessionStorage.removeItem('isLoggedIn');
                router.replace('/login');
            }, 2000);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
             setIsSaving(false);
        }
    }
    
    const renderPacDirStatus = () => {
        switch (pacDirStatus) {
            case 'loading':
                return <Badge variant="outline" className="gap-2"><Loader2 className="h-3 w-3 animate-spin" />Checking...</Badge>;
            case 'exists':
                return <Badge variant="secondary" className="gap-2 border-green-500/50 text-green-700 dark:text-green-400"><FolderCheck className="h-3 w-3" />Directory exists</Badge>;
            case 'not_found':
                return (
                    <div className='flex items-center gap-4'>
                        <Badge variant="destructive" className="gap-2"><FileWarning className="h-3 w-3" />Directory not found</Badge>
                        <Button size="sm" onClick={handleCreateDirectory} disabled={isCreatingDir}>
                            {isCreatingDir ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                            {isCreatingDir ? 'Creating...' : 'Create Directory'}
                        </Button>
                    </div>
                );
            case 'permission_denied':
            case 'error':
                 return <Badge variant="destructive" className="gap-2"><FileWarning className="h-3 w-3" />Error</Badge>;
            default:
                return null;
        }
    }


  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
            <CardDescription>Manage global settings for the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="p-4 border rounded-lg space-y-4">
                 <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Security</h3>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <span className="text-sm font-medium text-primary">{allSettings.sessionTimeoutMinutes || 15} min</span>
                    </div>
                    <Slider
                        id="session-timeout"
                        min={5}
                        max={120}
                        step={5}
                        value={[allSettings.sessionTimeoutMinutes || 15]}
                        onValueChange={(value) => handleSettingChange('sessionTimeoutMinutes', value[0])}
                    />
                    <p className="text-sm text-muted-foreground">
                        Users will be automatically logged out after this period of inactivity. Default is 15 minutes.
                    </p>
                </div>
            </div>
            
             <div className="p-4 border rounded-lg space-y-4">
                 <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">PAC File Settings</h3>
                </div>
                <div className="space-y-2">
                     <Label htmlFor="pac-file-path">Base Path for PAC files</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            id="pac-file-path"
                            value="/var/www/html/pac/"
                            disabled
                            className="font-mono flex-grow"
                        />
                        {renderPacDirStatus()}
                    </div>
                     <p className="text-sm text-muted-foreground">
                        {pacDirStatus === 'not_found' && "The application needs this directory to store generated PAC files. Click the button to create it."}
                        {pacDirStatus === 'exists' && "This is the server path where PAC files will be stored. It is not editable from the UI."}
                        {(pacDirStatus === 'permission_denied' || (pacDirStatus === 'error' && pacDirError)) && <span className='text-destructive'>{pacDirError || "An unknown error occurred."} Please check server permissions manually.</span>}
                    </p>
                </div>
            </div>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Saving...' : 'Save All Settings'}
                </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Credentials</CardTitle>
            <CardDescription>Update the login credentials for the management panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="current-username">Current Username</Label>
                    <Input id="current-username" value={currentUsername} onChange={(e) => setCurrentUsername(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
            </div>
            <hr className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="new-username">New Username</Label>
                    <Input id="new-username" placeholder="Enter new username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                 <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleCredentialChange} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Credentials'}
            </Button>
          </CardFooter>
        </Card>

    </div>
  );
}
