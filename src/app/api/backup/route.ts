
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite3');
const backupsDir = path.join(process.cwd(), 'backups');

// Ensures the backups directory exists.
async function ensureBackupsDir() {
  try {
    await fs.access(backupsDir);
  } catch {
    await fs.mkdir(backupsDir, { recursive: true });
  }
}

// GET all backup files
export async function GET() {
  await ensureBackupsDir();
  try {
    const files = await fs.readdir(backupsDir);
    const backupDetails = await Promise.all(
      files
        .filter(file => file.endsWith('.sqlite3'))
        .map(async (file) => {
          const filePath = path.join(backupsDir, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.mtime,
          };
        })
    );
    // Sort by creation date, newest first
    backupDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return NextResponse.json(backupDetails);
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json({ error: 'Failed to fetch backups.' }, { status: 500 });
  }
}

// POST to create a new backup
export async function POST() {
  await ensureBackupsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-${timestamp}.sqlite3`;
  const backupFilePath = path.join(backupsDir, backupFilename);

  try {
    // Check if source database file exists
    await fs.access(dbPath);
    
    // Copy the database file to the backups directory
    await fs.copyFile(dbPath, backupFilePath);
    
    return NextResponse.json({ message: 'Backup created successfully.', filename: backupFilename }, { status: 201 });
  } catch (error) {
     if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Source database file not found. Cannot create backup.' }, { status: 404 });
    }
    console.error('Backup creation error:', error);
    return NextResponse.json({ error: 'Failed to create backup.' }, { status: 500 });
  }
}
