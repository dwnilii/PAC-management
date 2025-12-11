
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Helper function to parse .env content
function parseEnv(content: string) {
    const lines = content.split('\n');
    const env: { [key: string]: string } = {};
    for (const line of lines) {
        // This regex handles quoted and unquoted values
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\s]+))?\s*(?:#.*)?$/);
        if (match) {
            const key = match[1];
            // The value will be in one of the capturing groups
            const value = match[2] || match[3] || match[4] || '';
            env[key] = value;
        }
    }
    return env;
}

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
        }

        const envPath = path.join(process.cwd(), '.env');
        const envFileContent = await fs.readFile(envPath, 'utf-8');
        const envVars = parseEnv(envFileContent);

        const serverUsername = envVars.ADMIN_USERNAME;
        const serverPassword = envVars.ADMIN_PASSWORD;

        if (username === serverUsername && password === serverPassword) {
            return NextResponse.json({ message: 'Login successful' });
        } else {
            return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
        }

    } catch (error) {
        console.error('Login error:', error);
         if (error.code === 'ENOENT') {
            return NextResponse.json({ error: 'Admin credentials are not set up on the server.' }, { status: 500 });
        }
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
