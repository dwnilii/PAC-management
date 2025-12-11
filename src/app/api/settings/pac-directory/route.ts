
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PAC_BASE_PATH = '/var/www/html/pac';

export async function GET() {
  try {
    // Check if the directory exists
    await fs.access(PAC_BASE_PATH, fs.constants.F_OK);
    // Check for write permissions (important)
    await fs.access(PAC_BASE_PATH, fs.constants.W_OK);
    return NextResponse.json({ status: 'exists' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory does not exist
      return NextResponse.json({ status: 'not_found' });
    }
    if (error.code === 'EACCES') {
      // Directory exists but is not writable
      return NextResponse.json({ status: 'permission_denied', error: `The directory exists but the application doesn't have permission to write to it.` });
    }
    // Other errors
    console.error('Error checking PAC directory:', error);
    return NextResponse.json({ status: 'error', error: 'An unexpected error occurred while checking the directory.' }, { status: 500 });
  }
}

export async function POST() {
  try {
    await fs.mkdir(PAC_BASE_PATH, { recursive: true });
    // After creating, check for write permissions
    await fs.access(PAC_BASE_PATH, fs.constants.W_OK);
    return NextResponse.json({ status: 'created', message: `Directory ${PAC_BASE_PATH} created successfully.` });
  } catch (error) {
    console.error('Error creating PAC directory:', error);
     if (error.code === 'EACCES') {
        return NextResponse.json({ status: 'error', error: 'Permission denied. The application could not create the directory.' }, { status: 500 });
    }
    return NextResponse.json({ status: 'error', error: 'Failed to create directory.' }, { status: 500 });
  }
}
