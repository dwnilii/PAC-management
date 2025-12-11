
'use server';

import fs from 'fs/promises';
import path from 'path';

// This action writes to the .env file. This is suitable for a traditional server environment
// but may NOT work in serverless environments with ephemeral/read-only filesystems (e.g., Vercel).
// If this fails, the credentials must be set as environment variables in the hosting provider's dashboard.

export async function saveCredentials(username, password) {
  if (!username || !password) {
    return { success: false, error: "Username and password cannot be empty." };
  }

  const envContent = `ADMIN_USERNAME="${username}"\nADMIN_PASSWORD="${password}"\n`;
  const envPath = path.join(process.cwd(), '.env');

  try {
    await fs.writeFile(envPath, envContent);
    // Return success, but let the client-side inform the user to restart.
    return { success: true };
  } catch (error) {
    console.error("Failed to write .env file:", error);
    // Return a specific error message.
    return { success: false, error: "Could not save credentials to the server. Check file system permissions." };
  }
}
