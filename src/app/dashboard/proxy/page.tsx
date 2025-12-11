
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, KeyRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const initialProxyData = { name: '', protocol: 'http', ip: '', port: '', username: '', password: '' };

export default function ProxyPage() {
  const [proxies, setProxies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<any>(null);
  const [proxyData, setProxyData] = useState(initialProxyData);
  const [proxyToDelete, setProxyToDelete] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  const fetchProxies = async () => {
      try {
        const response = await fetch('/api/proxies');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch proxies.');
        }
        const data = await response.json();
        setProxies(data);
      } catch (error: any) {
        console.error('Failed to fetch proxies:', error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  useEffect(() => {
    fetchProxies();
  }, []);


  const handleDialogOpen = (proxy: any = null) => {
    setEditingProxy(proxy);
    // If editing, don't show the existing password. It should be re-entered if it needs to be updated.
    // Ensure username is an empty string if it's null/undefined
    setProxyData(proxy ? { ...proxy, password: '', username: proxy.username || '' } : initialProxyData);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProxy(null);
  };

  const handleSave = async () => {
      // Frontend validation
      const { name, protocol, ip, port } = proxyData;
      if (!name || !protocol || !ip || !port) {
          toast({ 
              variant: 'destructive', 
              title: 'Validation Error', 
              description: 'Please fill all required fields (name, protocol, IP, and port)'
          });
          return;
      }

      // Port validation
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
          toast({ 
              variant: 'destructive', 
              title: 'Validation Error', 
              description: 'Port must be a number between 1 and 65535'
          });
          return;
      }

      // Protocol validation
      if (!['http', 'https', 'socks4', 'socks5'].includes(protocol.toLowerCase())) {
          toast({ 
              variant: 'destructive', 
              title: 'Validation Error', 
              description: 'Invalid protocol. Must be one of: HTTP, HTTPS, SOCKS4, SOCKS5'
          });
          return;
      }

      // IP validation (basic format check)
      const ipPattern = /^((\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|localhost)$/;
      if (!ipPattern.test(ip) && ip !== 'localhost') {
          toast({ 
              variant: 'destructive', 
              title: 'Validation Error', 
              description: 'Please enter a valid IP address or "localhost"'
          });
          return;
      }

      const url = editingProxy ? `/api/proxies/${editingProxy.id}` : '/api/proxies';
      const method = editingProxy ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...proxyData,
                port: portNum,
                protocol: protocol.toLowerCase()
            })
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save proxy.');
        }
        
        const result = await response.json();
        toast({ 
            title: 'Success', 
            description: result.message || `Proxy has been ${editingProxy ? 'updated' : 'created'}.`
        });
        fetchProxies();
        handleDialogClose();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };
  
  const handleDeleteConfirm = async () => {
    if (!proxyToDelete) return;
    
    try {
        const response = await fetch(`/api/proxies/${proxyToDelete.id}`, { method: 'DELETE' });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete proxy.');
        }
        
        toast({ title: 'Success', description: result.message || `Proxy "${proxyToDelete.name}" has been deleted.`});
        fetchProxies();
        setProxyToDelete(null);
        setIsDeleteConfirmOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleOpenDeleteDialog = (proxy: any) => {
    setProxyToDelete(proxy);
    setIsDeleteConfirmOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProxyData({...proxyData, [id]: value});
  }
  
  const handleSelectChange = (value: string) => {
    setProxyData({...proxyData, protocol: value});
  }


  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Proxy Management</CardTitle>
                    <CardDescription>Manage your proxy configurations for different protocols.</CardDescription>
                </div>
                <Button onClick={() => handleDialogOpen()}>Add Proxy</Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proxies.map((proxy: any) => (
                <TableRow key={proxy.id}>
                  <TableCell>{proxy.name}</TableCell>
                  <TableCell><Badge variant="outline" className="uppercase">{proxy.protocol}</Badge></TableCell>
                  <TableCell>{proxy.ip}</TableCell>
                  <TableCell>{proxy.port}</TableCell>
                  <TableCell>
                      {proxy.username && (
                          <Badge>
                              <KeyRound className="mr-1 h-3 w-3" />
                              Enabled
                          </Badge>
                      )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleDialogOpen(proxy)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(proxy)} className="text-destructive focus:text-destructive">
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
                This action cannot be undone. This will permanently delete the <strong>{proxyToDelete?.name}</strong> proxy configuration.
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
      
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProxy ? 'Edit Proxy' : 'Add New Proxy'}</DialogTitle>
            <DialogDescription>Configure the proxy details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input 
                    id="name"
                    value={proxyData.name}
                    onChange={handleInputChange}
                    placeholder="myproxy"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="protocol">Protocol <span className="text-destructive">*</span></Label>
                <Select 
                    value={proxyData.protocol} 
                    onValueChange={handleSelectChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a protocol"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="socks4">SOCKS4</SelectItem>
                        <SelectItem value="socks5">SOCKS5</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="ip">IP Address <span className="text-destructive">*</span></Label>
                <Input
                    id="ip"
                    value={proxyData.ip}
                    onChange={handleInputChange}
                    placeholder="127.0.0.1"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="port">Port <span className="text-destructive">*</span></Label>
                <Input
                    id="port"
                    type="number"
                    min="1"
                    max="65535"
                    value={proxyData.port}
                    onChange={handleInputChange}
                    placeholder="8080"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="username">Username <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                    id="username"
                    value={proxyData.username}
                    onChange={handleInputChange}
                    placeholder="username"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                    id="password"
                    type="password"
                    value={proxyData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                />
                 <p className="text-xs text-muted-foreground pt-1">
                    {editingProxy ? 'Leave blank to keep the current password.' : ''}
                </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    

    