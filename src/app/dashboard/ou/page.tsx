
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, GitBranch, Link, PlusCircle, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const PAC_BASE_URL = `/pac/`; // This should match your web server config

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

const initialOuData = { 
    name: '', 
    description: '', 
    color: availableColors[0].value, 
    proxy: '', 
    mode: 'proxyAll', 
    domains: [] as string[], 
    bypassDomains: [] as string[],
};

import { OU } from '@/types/app';

type OUData = Omit<OU, 'id' | 'created_at' | 'updated_at'>;

export default function OUPage() {
  const [ous, setOUs] = useState<any[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOU, setEditingOU] = useState<any>(null);
  const [ouData, setOUData] = useState<OUData>(initialOuData);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ouToDelete, setOuToDelete] = useState<any>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [ousRes, proxiesRes] = await Promise.all([
        fetch('/api/ous'),
        fetch('/api/proxies'),
      ]);
      if (!ousRes.ok || !proxiesRes.ok) {
        throw new Error('Failed to fetch initial data.');
      }
      const ousData = await ousRes.json();
      const proxiesData = await proxiesRes.json();
      
      setOUs(ousData);
      setProxies(proxiesData);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEditDialog = (ou: any = null) => {
    setEditingOU(ou);
    if (ou) {
        // Data from API is already parsed, so just set it
        setOUData({
            ...ou,
            description: ou.description || '',
            domains: ou.domains || [],
            bypassDomains: ou.bypassDomains || [],
        });
    } else {
        // For new OU, use initial data with a random color
        setOUData({ 
            ...initialOuData, 
            domains: [], 
            bypassDomains: [],
            color: availableColors[Math.floor(Math.random() * availableColors.length)].value 
        });
    }
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingOU(null);
    setOUData(initialOuData); // Reset form data
  };

  const validateOUData = (data: OUData) => {
    if (!data.name?.trim()) {
      throw new Error('OU name is required');
    }
    if (!data.proxy?.trim()) {
      throw new Error('You must select a proxy server');
    }
    if (data.domains?.some(d => !d.trim())) {
      throw new Error('Empty domain entries are not allowed');
    }
    if (data.bypassDomains?.some(d => !d.trim())) {
      throw new Error('Empty bypass domain entries are not allowed');
    }
  };

  const handleSave = async () => {
    try {
      validateOUData(ouData);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Validation Error', 
        description: error.message 
      });
      return;
    }

    const url = editingOU ? `/api/ous/${editingOU.id}` : '/api/ous';
    const method = editingOU ? 'PUT' : 'POST';

    // Clean up data before sending
    const payload = {
      ...ouData,
      name: ouData.name.trim(),
      description: ouData.description?.trim() || '',
      domains: ouData.domains?.filter(d => d.trim()) || [],
      bypassDomains: ouData.bypassDomains?.filter(d => d.trim()) || [],
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save the OU.');
        }
        
        toast({ title: 'Success', description: result.message || `Organizational unit has been ${editingOU ? 'updated' : 'created'}.` });
        fetchData(); // Refresh data from server
        handleCloseEditDialog();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!ouToDelete) return;

    try {
        const response = await fetch(`/api/ous/${ouToDelete.id}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete the OU.');
        }
        
        toast({ title: 'Success', description: result.message || `OU "${ouToDelete.name}" has been deleted.` });
        fetchData();
        setIsDeleteConfirmOpen(false);
        setOuToDelete(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        setIsDeleteConfirmOpen(false);
        setOuToDelete(null);
    }
  };
  
  const handleOpenDeleteDialog = (ou: any) => {
    setOuToDelete(ou);
    setIsDeleteConfirmOpen(true);
  };

  const handleCopyPacUrl = (ouName: string) => {
    if (!ouName) return;

    const pacUrl = `${window.location.origin}${PAC_BASE_URL}${ouName}/${ouName}.pac`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(pacUrl).then(() => {
            toast({ title: 'Copied!', description: 'PAC file URL copied to clipboard.' });
        }).catch(err => {
            console.error("Failed to copy URL: ", err);
            toast({ 
                variant: "destructive",
                title: "Copy Failed",
                description: "Could not copy URL to clipboard."
            });
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
        const newList = [...(ouData[listType] || [])];
        newList[index] = value;
        setOUData({ ...ouData, [listType]: newList });
    };

    const handleBulkDomainChange = (listType: 'domains' | 'bypassDomains', value: string) => {
        const newList = value.split('\n').map(d => d.trim()).filter(Boolean);
        setOUData({ ...ouData, [listType]: newList });
    }

    const addDomainToList = (listType: 'domains' | 'bypassDomains') => {
        setOUData(prev => ({ ...prev, [listType]: [...(prev[listType] || []), ''] }));
    };

    const removeDomainFromList = (listType: 'domains' | 'bypassDomains', index: number) => {
        const newList = (ouData[listType] || []).filter((_, i) => i !== index);
        setOUData({ ...ouData, [listType]: newList });
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
                {(ouData[listType] || []).map((domain, index) => (
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
                    value={(ouData[listType] || []).join('\n')}
                    onChange={(e) => handleBulkDomainChange(listType, e.target.value)}
                    className="min-h-[120px] font-mono text-xs"
                />
            </TabsContent>
        </Tabs>
    </div>
  );

  const isSaveDisabled = !ouData.name || !ouData.proxy;


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizational Units (OUs)</h1>
          <p className="text-muted-foreground">Manage OUs and their PAC file configurations.</p>
        </div>
        <Button onClick={() => handleOpenEditDialog()}>Add OU</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ous.map((ou: any) => (
            <Card 
              key={ou.id} 
              className="flex flex-col transition-shadow hover:shadow-lg cursor-pointer"
              onClick={() => handleOpenEditDialog(ou)}
            >
              <div className="h-2 w-full rounded-t-lg" style={{ backgroundColor: ou.color }}></div>
              <CardHeader>
                <CardTitle>{ou.name}</CardTitle>
                <CardDescription>{ou.description ?? 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow grid gap-4">
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <GitBranch className="h-4 w-4" />
                          <span>Routing Mode</span>
                      </div>
                      <Badge variant="outline">{ou.mode === 'proxyAll' ? 'Proxy All' : 'Direct Except'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <Link className="h-4 w-4" />
                          <span>PAC File URL</span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleCopyPacUrl(ou.name); }}>Copy URL</Button>
                  </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                 <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(ou); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(ou); }}>
                     <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
              </CardFooter>
            </Card>
        ))}
      </div>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{ouToDelete?.name}</strong> OU and its associated PAC file from the server.
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
            <DialogTitle>{editingOU ? 'Edit OU' : 'Add New OU'}</DialogTitle>
            <DialogDescription>
              {editingOU ? 'Update the details for this OU and its PAC file.' : 'Create a new OU and generate its PAC file.'}
            </DialogDescription>
          </DialogHeader>
            <ScrollArea className="max-h-[70vh] -mx-6 px-6">
                <div className="grid gap-6 py-4 px-1">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={ouData.name} onChange={(e) => setOUData({ ...ouData, name: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Input id="description" value={ouData.description ?? ''} onChange={(e) => setOUData({ ...ouData, description: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">Color</Label>
                        <Select 
                            value={ouData.color} 
                            onValueChange={(value) => setOUData({ ...ouData, color: value })}
                        >
                            <SelectTrigger className="col-span-3">
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                {ouData.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ouData.color }}></div>}
                                <span>{availableColors.find(c => c.value === ouData.color)?.name || 'Select a color'}</span>
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

                    <div className="space-y-4 rounded-lg border p-4">
                         <div className="space-y-2">
                            <Label htmlFor="proxy">Proxy Server</Label>
                            <Select value={ouData.proxy || ''} onValueChange={(value) => setOUData({ ...ouData, proxy: value })}>
                                <SelectTrigger><SelectValue placeholder="Select a Proxy" /></SelectTrigger>
                                <SelectContent>
                                    {proxies.map((proxy: any) => (<SelectItem key={proxy.id} value={proxy.name}>{proxy.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Assigning a proxy is required to create an OU.</p>
                        </div>
                        
                        <div className='space-y-2 pt-4 border-t'>
                            <Label>PAC File Mode</Label>
                            <RadioGroup
                                value={ouData.mode}
                                onValueChange={(value) => setOUData({...ouData, mode: value as 'proxyAll' | 'directExcept'})}
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
                        
                        {ouData.mode === 'directExcept' && renderDomainListEditor('domains', 'Domains to Proxy', 'Only these domains will be routed through the proxy.')}
                        {ouData.mode === 'proxyAll' && renderDomainListEditor('bypassDomains', 'Domains to Bypass', 'These domains will connect directly, ignoring the proxy.')}
                    </div>
                     <Alert variant="destructive">
                        <Link className="h-4 w-4" />
                        <AlertTitle>Web Server Configuration</AlertTitle>
                        <AlertDescription>
                            Remember to configure your web server (e.g., Nginx, Apache) to serve the files from `/var/www/html/pac/` so they are accessible via URL.
                        </AlertDescription>
                    </Alert>
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
