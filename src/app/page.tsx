
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for this page

// This function checks for the existence of the .env file directly.
async function getSetupStatus() {
  const envPath = path.join(process.cwd(), '.env');
  try {
    // Using fs.stat is more reliable for checking existence and avoids caching issues.
    await fs.stat(envPath);
    return true; // File exists, setup is complete.
  } catch (error) {
    // If the file doesn't exist (ENOENT), setup is not complete.
    if (error.code === 'ENOENT') {
      return false;
    }
    // For any other errors, log it and assume not set up as a safe default.
    console.error('Error checking for .env file:', error);
    return false;
  }
}

export default async function Home() {
  const isSetupComplete = await getSetupStatus();

  if (isSetupComplete) {
    redirect('/login');
  } else {
    redirect('/setup');
  }
}
