
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAndSavePacFile, deletePacFile } from '@/lib/pac';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  let userData;
  try {
    const db = await getDb();
    userData = await request.json();

    if (!userData.name) {
      return NextResponse.json({ error: 'User name is required.' }, { status: 400 });
    }
     if (!userData.proxy) {
        return NextResponse.json({ error: 'Assigning a proxy is required to update a user.' }, { status: 400 });
    }

    const oldUser = await db.get('SELECT name FROM users WHERE id = ?', id);
    if (!oldUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await db.run(
      'UPDATE users SET name = ?, description = ?, color = ?, proxy = ?, mode = ?, domains = ?, bypassDomains = ?, ou = ? WHERE id = ?',
      userData.name, 
      userData.description, 
      userData.color, 
      userData.proxy, 
      userData.mode, 
      JSON.stringify(userData.domains || []), 
      JSON.stringify(userData.bypassDomains || []), 
      userData.ou || null,
      id
    );

    if (oldUser.name !== userData.name) {
        await deletePacFile(oldUser.name, 'user');
    }
    
    await generateAndSavePacFile(userData.name, 'user');

    return NextResponse.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
     if (error.message.includes('UNIQUE constraint failed') && userData) {
      return NextResponse.json({ error: `A user with the name "${userData.name}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        
        const user = await db.get('SELECT name FROM users WHERE id = ?', id);
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        await db.run('DELETE FROM users WHERE id = ?', id);

        await deletePacFile(user.name, 'user');

        return NextResponse.json({ message: 'User and its PAC file deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
    }
}
