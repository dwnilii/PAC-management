
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAndSavePacFile } from '@/lib/pac';
import type { OU, User } from '@/types/app';


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const { name, protocol, ip, port, username, password } = await request.json();

    if (!name || !protocol || !ip || !port) {
      return NextResponse.json({ error: 'Missing required proxy fields.' }, { status: 400 });
    }

    // --- Start of Cascading Update Logic ---

    // 1. Get the current state of the proxy BEFORE updating it.
    const oldProxy = await db.get('SELECT name FROM proxies WHERE id = ?', id);
    if (!oldProxy) {
      return NextResponse.json({ error: 'Proxy not found.' }, { status: 404 });
    }
    const oldProxyName = oldProxy.name;

    // 2. Update the proxy in the database.
    if (password) {
        await db.run(
          'UPDATE proxies SET name = ?, protocol = ?, ip = ?, port = ?, username = ?, password = ? WHERE id = ?',
          name, protocol, ip, port, username, password, id
        );
    } else {
        await db.run(
          'UPDATE proxies SET name = ?, protocol = ?, ip = ?, port = ?, username = ? WHERE id = ?',
          name, protocol, ip, port, username, id
        );
    }

    // 3. Find all OUs and Users that were using the old proxy name.
    const ousToUpdate: OU[] = await db.all('SELECT name FROM ous WHERE proxy = ?', oldProxyName);
    const usersToUpdate: User[] = await db.all('SELECT name FROM users WHERE proxy = ?', oldProxyName);

    // If the proxy name was also changed, we need to update the foreign key in the child tables.
    if (oldProxyName !== name) {
        await db.run('UPDATE ous SET proxy = ? WHERE proxy = ?', name, oldProxyName);
        await db.run('UPDATE users SET proxy = ? WHERE proxy = ?', name, oldProxyName);
    }

    // 4. Regenerate PAC files for all affected entities.
    const regenerationPromises: Promise<void>[] = [];

    ousToUpdate.forEach(ou => {
        regenerationPromises.push(generateAndSavePacFile(ou.name, 'ou'));
    });

    usersToUpdate.forEach(user => {
        regenerationPromises.push(generateAndSavePacFile(user.name, 'user'));
    });
    
    // Wait for all PAC files to be regenerated.
    await Promise.all(regenerationPromises);
    
    console.log(`Cascading update: Regenerated PAC files for ${ousToUpdate.length} OUs and ${usersToUpdate.length} users.`);
    // --- End of Cascading Update Logic ---


    return NextResponse.json({ message: 'Proxy updated successfully and all associated PAC files have been regenerated.' });
  } catch (error) {
    console.error('Error updating proxy:', error);
    return NextResponse.json({ error: 'Failed to update proxy.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM proxies WHERE id = ?', id);
        return NextResponse.json({ message: 'Proxy deleted successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete proxy.' }, { status: 500 });
    }
}
