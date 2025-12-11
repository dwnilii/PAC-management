
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        // A simple security measure: check for a specific header or a secret if needed.
        // For now, we'll keep it simple as it's an internal tool.

        const scriptPath = path.join(process.cwd(), 'update.sh');
        
        const stream = new ReadableStream({
            start(controller) {
                const child = spawn('bash', [scriptPath]);
                
                // Stream stdout
                child.stdout.on('data', (data) => {
                    controller.enqueue(data);
                });

                // Stream stderr
                child.stderr.on('data', (data) => {
                    controller.enqueue(data);
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        controller.close();
                    } else {
                        // When there's an error, we still close the stream, but the client will see a non-200 status.
                         controller.close();
                    }
                });

                child.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        // The status of the response will depend on the script's exit code,
        // which we can't know synchronously. We'll send a 200 OK and let the client
        // interpret the streamed log for success/failure. A more advanced implementation
        // might use websockets or a two-step process.
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error) {
        console.error('Failed to start update process:', error);
        return NextResponse.json({ error: 'Failed to start update process.' }, { status: 500 });
    }
}
