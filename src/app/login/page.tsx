
import { ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from './login-form';


export default function LoginPage() {
    
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center">
             <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">PAC-Management Login</CardTitle>
          <CardDescription>
            Please sign in with your admin credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
           <div className="mt-4 text-center text-sm">
            <Dialog>
                <DialogTrigger asChild>
                     <Link href="#" className="underline" prefetch={false}>
                        Forgot password?
                    </Link>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Password Recovery</DialogTitle>
                        <DialogDescription>
                            How to manually reset your admin password.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert>
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Server Access Required</AlertTitle>
                      <AlertDescription>
                        <p>Admin credentials are stored in an environment file on your server for security. To reset them, you must have access to your server's file system (e.g., via SSH or your hosting provider's file manager).</p>
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                            <li>Connect to your server.</li>
                            <li>Navigate to the root directory of this application.</li>
                            <li>Open the file named <strong>.env</strong> with a text editor.</li>
                            <li>Find the lines starting with <strong>ADMIN_USERNAME</strong> and <strong>ADMIN_PASSWORD</strong>.</li>
                            <li>Update the values to your new desired credentials.</li>
                            <li>Save the file. No application restart is needed.</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
