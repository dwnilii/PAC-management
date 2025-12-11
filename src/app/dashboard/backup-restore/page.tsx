
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, Upload, Download, AlertTriangle, MoreHorizontal, Trash2, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

export default function BackupRestorePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [itemToAction, setItemToAction] = useState<BackupFile | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'restore' | 'delete' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/backup');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch backups.');
        }
        const data = await response.json();
        setBackups(data);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backup', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create server-side backup.');
      }
      toast({
        title: "Backup Successful",
        description: `Backup '${result.filename}' created on the server.`,
      });
      fetchBackups(); // Refresh the list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Backup Failed",
        description: error.message,
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (filename: string) => {
    // This will trigger a download by navigating to the API endpoint
    window.location.href = `/api/restore?file=${filename}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/x-sqlite3' || file.name.endsWith('.sqlite3'))) {
      setSelectedFile(file);
    } else {
      if (file) {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please select a valid .sqlite3 backup file." });
      }
      setSelectedFile(null);
      event.target.value = '';
    }
  };

  const handleRestoreFromFile = async () => {
    if (!selectedFile) {
      toast({ variant: "destructive", title: "No File Selected" });
      return;
    }
    setIsRestoring(true);
    const formData = new FormData();
    formData.append('backupFile', selectedFile);

    try {
        const response = await fetch('/api/restore', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to restore.');
        }
        toast({ title: "Restore Successful", description: result.message });
        setSelectedFile(null);
        if (document.getElementById('backup-file-upload')) {
           (document.getElementById('backup-file-upload') as HTMLInputElement).value = '';
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Restore Failed", description: error.message });
    } finally {
        setIsRestoring(false);
    }
  };

  const openConfirmationDialog = (item: BackupFile, action: 'restore' | 'delete') => {
    setItemToAction(item);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };
  
  const handleConfirmAction = async () => {
    if (!itemToAction || !confirmAction) return;

    if (confirmAction === 'delete') {
        try {
            const response = await fetch(`/api/restore?file=${itemToAction.filename}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete backup.');
            }
            toast({ title: 'Backup Deleted', description: `Backup '${itemToAction.filename}' has been removed from the server.` });
            fetchBackups();
        } catch (error: any) {
             toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        } finally {
            setIsConfirmOpen(false);
            setItemToAction(null);
            setConfirmAction(null);
        }
    }

    if (confirmAction === 'restore') {
        setIsRestoring(true);
        try {
            const response = await fetch('/api/restore', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restoreFrom: itemToAction.filename })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to restore from server backup.');
            }
            toast({ title: "Restore Successful", description: result.message });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Restore Failed", description: error.message });
        } finally {
            setIsRestoring(false);
            setIsConfirmOpen(false);
            setItemToAction(null);
            setConfirmAction(null);
        }
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  const renderBackupTable = () => {
    if (isLoading) {
        return (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (backups.length === 0) {
        return <p className="text-muted-foreground text-center mt-8">No server-side backups found.</p>
    }

      return (
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {backups.map((backup: BackupFile) => (
                      <TableRow key={backup.filename}>
                          <TableCell className="font-medium">{backup.filename}</TableCell>
                          <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{formatBytes(backup.size)}</TableCell>
                          <TableCell className="text-right">
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => openConfirmationDialog(backup, 'restore')}>
                                          <RotateCcw className="mr-2 h-4 w-4" />
                                          Restore From This
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDownloadBackup(backup.filename)}>
                                          <Download className="mr-2 h-4 w-4" />
                                          Download
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openConfirmationDialog(backup, 'delete')}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete From Server
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      );
  }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Upload className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Restore from Local File</CardTitle>
                        <CardDescription>Upload a .sqlite3 file to restore the application state.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Input id="backup-file-upload" type="file" onChange={handleFileChange} className="flex-grow" accept=".sqlite3,application/x-sqlite3"/>
                    <Button onClick={handleRestoreFromFile} disabled={!selectedFile || isRestoring}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isRestoring ? 'Restoring...' : 'Restore from File'}
                    </Button>
                </div>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Restoring from a backup will completely overwrite the current database. This action cannot be undone.
                  </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className='flex justify-between items-start'>
                <div>
                    <CardTitle>Server-Side Backups</CardTitle>
                    <CardDescription>Manage and restore from backups stored directly on the server.</CardDescription>
                </div>
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isCreatingBackup ? 'Creating...' : 'Create New Backup'}
                </Button>
            </div>
          </CardHeader>
          <CardContent>
                 {renderBackupTable()}
          </CardContent>
        </Card>

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                      {confirmAction === 'delete' && `This will permanently delete the backup file '${itemToAction?.filename}' from the server. This action cannot be undone.`}
                      {confirmAction === 'restore' && `This will restore the system to the state of the backup file '${itemToAction?.filename}'. The current live database will be overwritten.`}
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleConfirmAction} variant={confirmAction === 'delete' ? 'destructive' : 'default'} disabled={isRestoring}>
                      {isRestoring ? 'Restoring...' : (confirmAction === 'delete' ? 'Delete Backup' : 'Confirm Restore')}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
