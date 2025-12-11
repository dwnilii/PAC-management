
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const proxies = await db.all('SELECT * FROM proxies ORDER BY name');
    
    // We don't want to expose passwords
    const safeProxies = proxies.map(({ password, ...rest }) => rest);
    return NextResponse.json(safeProxies);
  } catch (error) {
    console.error('Error fetching proxies:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch proxies. Please try again.' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const { name, protocol, ip, port, username, password } = await request.json();

    // Validate required fields
    if (!name || !protocol || !ip || !port) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, protocol, ip, and port are required.' 
      }, { status: 400 });
    }

    // Validate port number
    if (isNaN(parseInt(port)) || parseInt(port) <= 0 || parseInt(port) > 65535) {
      return NextResponse.json({ 
        error: 'Invalid port number. Port must be between 1 and 65535.' 
      }, { status: 400 });
    }

    // Validate protocol
    if (!['http', 'https', 'socks4', 'socks5'].includes(protocol.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Invalid protocol. Must be one of: http, https, socks4, socks5' 
      }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await db.get('SELECT id FROM proxies WHERE name = ?', [name]);
    if (existing) {
      return NextResponse.json({ 
        error: 'A proxy with this name already exists' 
      }, { status: 409 });
    }

    // Check if the database is ready
    try {
      await db.get('SELECT 1 FROM proxies LIMIT 1');
    } catch (dbError) {
      console.error('Database table check failed:', dbError);
      return NextResponse.json({ 
        error: 'Database is not properly initialized' 
      }, { status: 500 });
    }

    const result = await db.run(
      'INSERT INTO proxies (name, protocol, ip, port, username, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, protocol.toLowerCase(), ip, parseInt(port), username || null, password || null]
    );

    return NextResponse.json({ id: result.lastID }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create proxy.' }, { status: 500 });
  }
}

    