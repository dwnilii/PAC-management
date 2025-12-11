
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite3');
const backupsDir = path.join(process.cwd(), 'backups');

// GET a specific backup file for download
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');

  if (!filename) {
    return new NextResponse(JSON.stringify({ error: 'Filename is required.' }), { status: 400 });
  }

  // Security: Prevent directory traversal attacks
  if (filename.includes('..') || path.isAbsolute(filename)) {
     return new NextResponse(JSON.stringify({ error: 'Invalid filename.' }), { status: 400 });
  }

  const filePath = path.join(backupsDir, filename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/x-sqlite3');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse(JSON.stringify({ error: 'Backup file not found.' }), { status: 404 });
    }
    console.error('Backup download error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to download backup.' }), { status: 500 });
  }
}


// POST to restore from an uploaded file or an existing server-side backup
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Case 1: Restore from an uploaded file
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('backupFile') as File | null;

      if (!file) {
        return new NextResponse(JSON.stringify({ error: 'No backup file provided.' }), { status: 400 });
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(dbPath, fileBuffer);

      return new NextResponse(JSON.stringify({ message: 'Restore from uploaded file successful. The application is now using the restored database.' }), { status: 200 });
    }

    // Case 2: Restore from an existing server-side backup
    if (contentType.includes('application/json')) {
        const { restoreFrom } = await request.json();
        if (!restoreFrom) {
             return new NextResponse(JSON.stringify({ error: 'Backup filename to restore from is required.' }), { status: 400 });
        }
        if (restoreFrom.includes('..') || path.isAbsolute(restoreFrom)) {
            return new NextResponse(JSON.stringify({ error: 'Invalid filename.' }), { status: 400 });
        }
        const sourcePath = path.join(backupsDir, restoreFrom);
        await fs.copyFile(sourcePath, dbPath);

        return new NextResponse(JSON.stringify({ message: `Restored successfully from '${restoreFrom}'.` }), { status: 200 });
    }

    return new NextResponse(JSON.stringify({ error: 'Unsupported content type for restore operation.' }), { status: 415 });

  } catch (error: any) {
    console.error('Restore error:', error);
    if (error.code === 'ENOENT') {
         return new NextResponse(JSON.stringify({ error: 'Source backup file not found on server.' }), { status: 404 });
    }
    return new NextResponse(JSON.stringify({ error: 'Failed to restore backup.' }), { status: 500 });
  }
}


// DELETE a specific backup file
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');

  if (!filename) {
    return new NextResponse(JSON.stringify({ error: 'Filename is required.' }), { status: 400 });
  }

  if (filename.includes('..') || path.isAbsolute(filename)) {
     return new NextResponse(JSON.stringify({ error: 'Invalid filename.' }), { status: 400 });
  }
  
  const filePath = path.join(backupsDir, filename);

  try {
    await fs.unlink(filePath);
    return new NextResponse(JSON.stringify({ message: `Backup file '${filename}' deleted successfully.` }), { status: 200 });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse(JSON.stringify({ error: 'Backup file not found.' }), { status: 404 });
    }
    console.error('Backup deletion error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete backup.' }), { status: 500 });
  }
}
