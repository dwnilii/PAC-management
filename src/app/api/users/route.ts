
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAndSavePacFile } from '@/lib/pac';

// GET all Users
export async function GET() {
  try {
    const db = await getDb();
    const users = await db.all('SELECT * FROM users ORDER BY name');
    
    // The domains are stored as JSON strings, so we parse them before sending.
    const parsedUsers = users.map(user => ({
        ...user,
        domains: user.domains ? JSON.parse(user.domains) : [],
        bypassDomains: user.bypassDomains ? JSON.parse(user.bypassDomains) : [],
    }));

    return NextResponse.json(parsedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

// POST a new User
export async function POST(request: NextRequest) {
  let userData;
  try {
    userData = await request.json();

    // --- Validation ---
    if (!userData.name || !userData.name.trim()) {
      return NextResponse.json({ error: 'User name is required.' }, { status: 400 });
    }
    if (!userData.proxy) {
      return NextResponse.json({ error: 'Assigning a proxy is required to create a user.' }, { status: 400 });
    }

    const db = await getDb();
    let result;
    
    // --- Database Insertion ---
    try {
        result = await db.run(
          'INSERT INTO users (name, description, color, proxy, mode, domains, bypassDomains, ou) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          userData.name.trim(),
          userData.description || null,
          userData.color,
          userData.proxy,
          userData.mode,
          JSON.stringify(userData.domains || []),
          JSON.stringify(userData.bypassDomains || []),
          userData.ou || null
        );
    } catch (dbError: any) {
        if (dbError.message.includes('UNIQUE constraint failed: users.name')) {
            return NextResponse.json({ error: `A user with the name "${userData.name}" already exists.` }, { status: 409 });
        }
        throw dbError;
    }

    const newUserId = result.lastID;
    if (!newUserId) {
        throw new Error('Failed to create user in the database, no ID returned.');
    }

    // --- PAC File Generation ---
    try {
        await generateAndSavePacFile(userData.name.trim(), 'user');
    } catch (pacError: any) {
        console.error(`PAC file generation failed for ${userData.name}. Rolling back database entry.`);
        await db.run('DELETE FROM users WHERE id = ?', newUserId);
        throw pacError;
    }

    // --- Success ---
    return NextResponse.json({ 
        id: newUserId, 
        message: 'User created and PAC file generated successfully.' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
