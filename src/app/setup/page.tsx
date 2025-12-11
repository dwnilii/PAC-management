
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { SetupForm } from './setup-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for this page

async function isSetupComplete() {
  const envPath = path.join(process.cwd(), '.env');
  try {
    await fs.stat(envPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
        return false;
    }
    console.error("Error checking .env file in setup page:", error);
    return true; // As a safe default, prevent showing setup if there's an error.
  }
}

export default async function SetupPage() {
  if (await isSetupComplete()) {
    redirect('/login');
  }

  return <SetupForm />;
}
