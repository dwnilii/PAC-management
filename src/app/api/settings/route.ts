
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const SETTINGS_KEY = 'pacManagementSettings';

// GET the settings
export async function GET() {
  try {
    const db = await getDb();
    const result = await db.get('SELECT value FROM settings WHERE key = ?', SETTINGS_KEY);
    
    if (!result) {
      // Return an empty object if no settings are found, ensures client always gets a valid object
      return NextResponse.json({});
    }
    
    // The value is stored as a JSON string, so we need to parse it
    const settings = JSON.parse(result.value);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

// POST to create or update the settings
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const settings = await request.json();

    if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ error: 'Invalid settings object provided.' }, { status: 400 });
    }

    const settingsString = JSON.stringify(settings);
    await db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      SETTINGS_KEY,
      settingsString
    );

    return NextResponse.json({ message: 'Settings saved successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}
