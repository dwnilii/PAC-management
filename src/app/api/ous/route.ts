
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAndSavePacFile } from '@/lib/pac';

// GET all Organizational Units
export async function GET() {
  try {
    const db = await getDb();
    // Fetch all OUs and join with proxies to get proxy details if needed, though here we just order by name.
    const ous = await db.all('SELECT * FROM ous ORDER BY name');
    
    // The domains are stored as JSON strings, so we parse them before sending.
    const parsedOus = ous.map(ou => ({
        ...ou,
        domains: ou.domains ? JSON.parse(ou.domains) : [],
        bypassDomains: ou.bypassDomains ? JSON.parse(ou.bypassDomains) : [],
    }));

    return NextResponse.json(parsedOus);
  } catch (error) {
    console.error('Failed to fetch OUs:', error);
    return NextResponse.json({ error: 'Failed to fetch organizational units.' }, { status: 500 });
  }
}

// POST a new Organizational Unit
export async function POST(request: NextRequest) {
  let ouData;
  try {
    ouData = await request.json();

    // --- Validation ---
    if (!ouData.name || !ouData.name.trim()) {
      return NextResponse.json({ error: 'OU name is required.' }, { status: 400 });
    }
    if (!ouData.proxy) {
      return NextResponse.json({ error: 'Assigning a proxy is required to create an OU.' }, { status: 400 });
    }

    const db = await getDb();
    let result;
    
    // --- Database Insertion ---
    try {
        result = await db.run(
          'INSERT INTO ous (name, description, color, proxy, mode, domains, bypassDomains) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ouData.name.trim(),
          ouData.description || null,
          ouData.color,
          ouData.proxy,
          ouData.mode,
          JSON.stringify(ouData.domains || []),
          JSON.stringify(ouData.bypassDomains || [])
        );
    } catch (dbError: any) {
        // Handle unique constraint violation specifically
        if (dbError.message.includes('UNIQUE constraint failed: ous.name')) {
            return NextResponse.json({ error: `An OU with the name "${ouData.name}" already exists.` }, { status: 409 });
        }
        // For other DB errors, re-throw to be caught by the outer catch block
        throw dbError;
    }

    const newOuId = result.lastID;
    if (!newOuId) {
        throw new Error('Failed to create OU in the database, no ID returned.');
    }

    // --- PAC File Generation ---
    try {
        await generateAndSavePacFile(ouData.name.trim(), 'ou');
    } catch (pacError: any) {
        // If PAC file generation fails, we must roll back the database change.
        console.error(`PAC file generation failed for ${ouData.name}. Rolling back database entry.`);
        await db.run('DELETE FROM ous WHERE id = ?', newOuId);
        // We throw the original PAC error to be sent to the client
        throw pacError;
    }

    // --- Success ---
    return NextResponse.json({ 
        id: newOuId, 
        message: 'Organizational unit created and PAC file generated successfully.' 
    }, { status: 201 });

  } catch (error: any) {
    // --- General Error Handling ---
    console.error('Error creating OU:', error);
    // Use the error message from the thrown error if available
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
