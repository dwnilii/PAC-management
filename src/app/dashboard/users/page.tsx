
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Link, PlusCircle, X, Search, MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, OU } from '@/types/app';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';


const PAC_BASE_URL = `/pac/users/`;

const availableColors = [
    { name: 'Blue', value: '#3b82f6' }, { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' }, { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' }, { name: 'Indigo', value: '#6366f1' },
    { name: 'Pink', value: '#ec4899' }, { name: 'Teal', value: '#14b8a6' },
    { name: 'Yellow', value: '#eab308' }, { name: 'Cyan', value: '#06b6d4' },
    { name: 'Lime', value: '#84cc16' }, { name: 'Emerald', value: '#10b981' },
    { name: 'Sky', value: '#0ea5e9' }, { name: 'Violet', value: '#8b5cf6' },
    { name: 'Fuchsia', value: '#d946ef' }, { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' }, { name: 'Stone', value: '#78716c' },
    { name: 'Slate', value: '#64748b' }, { name: 'Gray', value: '#6b7280' },
];

type UserData = Omit<User, 'id' | 'created_at' | 'updated_at'>;

const initialUserData: UserData = { 
    name: '', 
    description: '', 
    color: availableColors[0].value, 
    proxy: '', 
    ou: '',
    mode: 'proxyAll', 
    domains: [] as string[], 
    bypassDomains: [] as string[],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [ous, setOus] = useState<OU[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [usersRes, proxiesRes, ousRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/proxies'),
        fetch('/api/ous'),
      ]);
      if (!usersRes.ok || !proxiesRes.ok || !ousRes.ok) {
        throw new Error('Failed to fetch initial data.');
      }
      const usersData = await usersRes.json();
      const proxiesData = await proxiesRes.json();
      const ousData = await ousRes.json();
      
      setUsers(usersData);
      setProxies(proxiesData);
      setOus(ousData);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (userData.ou) {
        const selectedOu = ous.find(ou => ou.name === userData.ou);
        if (selectedOu) {
            setUserData(prev => ({...prev, color: selectedOu.color}));
        }
    }
  }, [userData.ou, ous]);

  const handleOpenEditDialog = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
        setUserData({
            ...user,
            description: user.description || '',
            domains: user.domains || [],
            bypassDomains: user.bypassDomains || [],
            ou: user.ou || '',
        });
    } else {
        setUserData({ 
            ...initialUserData, 
            domains: [], 
            bypassDomains: [],
            color: availableColors[Math.floor(Math.random() * availableColors.length)].value 
        });
    }
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setUserData(initialUserData);
  };

  const validateUserData = (data: UserData) => {
    if (!data.name?.trim()) throw new Error('User name is required');
    if (!data.proxy?.trim()) throw new Error('You must select a proxy server');
    if (data.domains?.some(d => !d.trim())) throw new Error('Empty domain entries are not allowed');
    if (data.bypassDomains?.some(d => !d.trim())) throw new Error('Empty bypass domain entries are not allowed');
  };

  const handleSave = async () => {
    try {
      validateUserData(userData);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Validation Error', description: error.message });
      return;
    }

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    const payload = {
      ...userData,
      name: userData.name.trim(),
      description: userData.description?.trim() || '',
      domains: userData.domains?.filter(d => d.trim()) || [],
      bypassDomains: userData.bypassDomains?.filter(d => d.trim()) || [],
      ou: userData.ou || null
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save the user.');
        }
        
        toast({ title: 'Success', description: result.message || `User has been ${editingUser ? 'updated' : 'created'}.` });
        fetchData();
        handleCloseEditDialog();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
        const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete the user.');
        }
        toast({ title: 'Success', description: result.message || `User "${userToDelete.name}" has been deleted.` });
        fetchData();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
    }
  };
  
  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleCopyPacUrl = (userName: string) => {
    if (!userName) return;

    const pacUrl = `${window.location.origin}${PAC_BASE_URL}${userName}/${userName}.pac`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(pacUrl).then(() => {
            toast({ title: 'Copied!', description: 'PAC file URL copied to clipboard.' });
        }).catch(err => {
            console.error("Failed to copy URL: ", err);
            toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy URL to clipboard." });
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = pacUrl;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            toast({ title: 'Copied!', description: 'PAC file URL copied to clipboard.' });
        } catch (err) {
            console.error("Fallback copy failed: ", err);
            toast({ variant: "destructive", title: "Copy Failed", description: "Please copy the URL manually." });
        }
        document.body.removeChild(textArea);
    }
}

    const handleDomainListChange = (listType: 'domains' | 'bypassDomains', index: number, value: string) => {
        const newList = [...(userData[listType] || [])];
        newList[index] = value;
        setUserData({ ...userData, [listType]: newList });
    };

    const handleBulkDomainChange = (listType: 'domains' | 'bypassDomains', value: string) => {
        const newList = value.split('\n').map(d => d.trim()).filter(Boolean);
        setUserData({ ...userData, [listType]: newList });
    }

    const addDomainToList = (listType: 'domains' | 'bypassDomains') => {
        setUserData(prev => ({ ...prev, [listType]: [...(prev[listType] || []), ''] }));
    };

    const removeDomainFromList = (listType: 'domains' | 'bypassDomains', index: number) => {
        const newList = (userData[listType] || []).filter((_, i) => i !== index);
        setUserData({ ...userData, [listType]: newList });
    };

  const renderDomainListEditor = (listType: 'domains' | 'bypassDomains', label: string, description: string) => (
    <div className="space-y-2 pt-4 border-t">
        <div className="space-y-1">
            <Label>{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Tabs defaultValue="individual">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Edit</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="space-y-2 pt-2">
                {(userData[listType] || []).map((domain, index) => (
                <div key={`${listType}-${index}`} className="flex items-center gap-2">
                    <Input
                    placeholder="*.example.com"
                    value={domain}
                    onChange={(e) => handleDomainListChange(listType, index, e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeDomainFromList(listType, index)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addDomainToList(listType)}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add Domain
                </Button>
            </TabsContent>
            <TabsContent value="bulk" className="pt-2">
                <Textarea
                    placeholder="Enter one domain per line, e.g.,&#10;*.example.com&#10;example.org&#10;192.168.1.0/24"
                    value={(userData[listType] || []).join('\n')}
                    onChange={(e) => handleBulkDomainChange(listType, e.target.value)}
                    className="min-h-[120px] font-mono text-xs"
                />
            </TabsContent>
        </Tabs>
    </div>
  );
  
  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTerm) ||
      (user.description && user.description.toLowerCase().includes(searchTerm)) ||
      (user.ou && user.ou.toLowerCase().includes(searchTerm))
    );
  });

  const isSaveDisabled = !userData.name || !userData.proxy;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage users and their PAC file configurations.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button onClick={() => handleOpenEditDialog()} className="flex-shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
            </Button>
        </div>
      </div>

       <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organizational Unit</TableHead>
                <TableHead>Routing Mode</TableHead>
                <TableHead>PAC URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} onClick={() => handleOpenEditDialog(user)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: user.color }}></span>
                        <div className="font-medium">{user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.ou ? <Badge variant="secondary">{user.ou}</Badge> : <span className="text-muted-foreground">None</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.mode === 'proxyAll' ? 'Proxy All' : 'Direct Except'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleCopyPacUrl(user.name); }}>
                        <Link className="mr-2 h-4 w-4" />
                        Copy URL
                    </Button>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(user)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{userToDelete?.name}</strong> user and its associated PAC file.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleDeleteConfirm} variant="destructive">Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update the details for this user.' : 'Create a new user and generate its PAC file.'}
            </DialogDescription>
          </DialogHeader>
            <ScrollArea className="max-h-[70vh] -mx-6 px-6">
                <div className="grid gap-6 py-4 px-1">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Input id="description" value={userData.description ?? ''} onChange={(e) => setUserData({ ...userData, description: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ou" className="text-right">OU</Label>
                        <Select value={userData.ou || ''} onValueChange={(value) => setUserData({ ...userData, ou: value })}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select an OU (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {ous.map((ou: any) => (<SelectItem key={ou.id} value={ou.name}>{ou.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    {!userData.ou && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">Color</Label>
                            <Select 
                                value={userData.color} 
                                onValueChange={(value) => setUserData({ ...userData, color: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                    {userData.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: userData.color }}></div>}
                                    <span>{availableColors.find(c => c.value === userData.color)?.name || 'Select a color'}</span>
                                    </div>
                                </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableColors.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }}></div>
                                            <span>{c.name}</span>
                                        </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-4 rounded-lg border p-4">
                         <div className="space-y-2">
                            <Label htmlFor="proxy">Proxy Server</Label>
                            <Select value={userData.proxy || ''} onValueChange={(value) => setUserData({ ...userData, proxy: value })}>
                                <SelectTrigger><SelectValue placeholder="Select a Proxy" /></SelectTrigger>
                                <SelectContent>
                                    {proxies.map((proxy: any) => (<SelectItem key={proxy.id} value={proxy.name}>{proxy.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Assigning a proxy is required.</p>
                        </div>
                        
                        <div className='space-y-2 pt-4 border-t'>
                            <Label>PAC File Mode</Label>
                            <RadioGroup
                                value={userData.mode}
                                onValueChange={(value) => setUserData({...userData, mode: value as 'proxyAll' | 'directExcept'})}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="proxyAll" id="proxyAll" />
                                    <Label htmlFor="proxyAll">Proxy All (with bypass)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="directExcept" id="directExcept" />
                                    <Label htmlFor="directExcept">Direct All (with exceptions)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        {userData.mode === 'directExcept' && renderDomainListEditor('domains', 'Domains to Proxy', 'Only these domains will be routed through the proxy.')}
                        {userData.mode === 'proxyAll' && renderDomainListEditor('bypassDomains', 'Domains to Bypass', 'These domains will connect directly, ignoring the proxy.')}
                    </div>
                </div>
            </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaveDisabled}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
