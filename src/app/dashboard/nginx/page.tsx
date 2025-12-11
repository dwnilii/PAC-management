
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Copy, Server, Info, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const nginxConfig = `server {
    listen 80;
    server_name _;

    root /var/www/html;

   
    location /pac/ {
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
    }

   
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

const CommandBlock = ({ command }: { command: string }) => {
    const { toast } = useToast();

    const handleCopy = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(command).then(() => {
                toast({ title: "Copied!", description: "Command copied to clipboard." });
            }).catch(() => {
                toast({ variant: "destructive", title: "Failed", description: "Could not copy command." });
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = command;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                toast({ title: "Copied!", description: "Command copied to clipboard." });
            } catch (err) {
                toast({ variant: "destructive", title: "Copy Failed", description: "Please copy the command manually." });
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
            <Terminal className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <code className="flex-grow text-sm font-mono">{command}</code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function NginxPage() {
    const { toast } = useToast();
    
    const copyConfigToClipboard = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(nginxConfig).then(() => {
                toast({ title: "Copied!", description: "Nginx configuration copied to clipboard." });
            }).catch(err => {
                toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy configuration." });
            });
        } else {
             const textArea = document.createElement("textarea");
            textArea.value = nginxConfig;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                toast({ title: "Copied!", description: "Nginx configuration copied to clipboard." });
            } catch (err) {
                toast({ variant: "destructive", title: "Copy Failed", description: "Please copy the configuration manually." });
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Nginx Configuration</CardTitle>
                            <CardDescription>
                                Recommended Nginx setup to serve PAC files and proxy the panel.
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={copyConfigToClipboard}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Config
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                        <code className="language-nginx">{nginxConfig}</code>
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Installation Steps</CardTitle>
                    <CardDescription>
                        Follow these steps to apply the configuration on your Debian/Ubuntu server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                            The automated <code className="font-mono bg-muted p-1 rounded-sm">install.sh</code> script handles these steps for you. This guide is for manual setup or verification.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-3">
                         <div>
                            <h4 className="font-medium text-sm mb-1">1. Install Nginx</h4>
                            <p className="text-sm text-muted-foreground mb-2">First, ensure Nginx is installed on your server.</p>
                            <CommandBlock command="sudo apt update && sudo apt install nginx -y" />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm mb-1">2. Create Configuration File</h4>
                             <p className="text-sm text-muted-foreground mb-2">Create a new file for the PAC server configuration. You can use <code className="font-mono">nano</code> or any other editor.</p>
                            <CommandBlock command="sudo nano /etc/nginx/sites-available/pac-server" />
                             <p className="text-sm text-muted-foreground mt-2">Then, copy and paste the configuration from the card above into this file and save it.</p>
                        </div>
                         <div>
                            <h4 className="font-medium text-sm mb-1">3. Enable the Site</h4>
                            <p className="text-sm text-muted-foreground mb-2">Create a symbolic link to enable the new configuration and remove the default one.</p>
                            <CommandBlock command="sudo ln -s /etc/nginx/sites-available/pac-server /etc/nginx/sites-enabled/ && sudo rm /etc/nginx/sites-enabled/default" />
                        </div>
                         <div>
                            <h4 className="font-medium text-sm mb-1">4. Test and Restart Nginx</h4>
                             <p className="text-sm text-muted-foreground mb-2">Test your Nginx configuration for syntax errors and then restart the service to apply the changes.</p>
                            <CommandBlock command="sudo nginx -t && sudo systemctl restart nginx" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
