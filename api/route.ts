export const dynamic = 'force-dynamic'; // Ensure we get fresh data

export async function GET() {
    const ROBOT_API = process.env.ROBOT_API || 'http://localhost:8080';

    try {
        const response = await fetch(`${ROBOT_API}/telemetry`);

        if (!response.ok) {
            throw new Error('Failed to fetch telemetry');
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Unable to connect to robot' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}