
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAndSavePacFile, deletePacFile } from '@/lib/pac';
import path from 'path';
import fs from 'fs/promises';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  let ouData; // Define ouData outside the try block
  try {
    const db = await getDb();
    ouData = await request.json();

    if (!ouData.name) {
      return NextResponse.json({ error: 'OU name is required.' }, { status: 400 });
    }
     if (!ouData.proxy) {
        return NextResponse.json({ error: 'Assigning a proxy is required to update an OU.' }, { status: 400 });
    }

    const oldOu = await db.get('SELECT name FROM ous WHERE id = ?', id);
    if (!oldOu) {
        return NextResponse.json({ error: 'OU not found.' }, { status: 404 });
    }

    await db.run(
      'UPDATE ous SET name = ?, description = ?, color = ?, proxy = ?, mode = ?, domains = ?, bypassDomains = ? WHERE id = ?',
      ouData.name, 
      ouData.description, 
      ouData.color, 
      ouData.proxy, 
      ouData.mode, 
      JSON.stringify(ouData.domains || []), 
      JSON.stringify(ouData.bypassDomains || []), 
      id
    );

    // If the name changed, delete the old PAC file and its directory
    if (oldOu.name !== ouData.name) {
        await deletePacFile(oldOu.name, 'ou');
    }
    
    // Generate/update the PAC file with new data/name
    await generateAndSavePacFile(ouData.name, 'ou');

    return NextResponse.json({ message: 'OU updated successfully.' });
  } catch (error) {
    console.error('Error updating OU:', error);
     if (error.message.includes('UNIQUE constraint failed') && ouData) {
      return NextResponse.json({ error: `An OU with the name "${ouData.name}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update OU.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        
        const ou = await db.get('SELECT name FROM ous WHERE id = ?', id);
        if (!ou) {
            return NextResponse.json({ error: 'OU not found.' }, { status: 404 });
        }

        await db.run('DELETE FROM ous WHERE id = ?', id);

        // After deleting from DB, delete the corresponding PAC file and directory
        await deletePacFile(ou.name, 'ou');

        return NextResponse.json({ message: 'OU and its PAC file deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete OU.' }, { status: 500 });
    }
}
