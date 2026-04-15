import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Streaming proxy for POST /api/analysis/trade-journal.
 * Pipes the FastAPI SSE stream directly to the browser (same pattern as /analysis/run).
 */
export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_URL || 'http://localhost:8000';
  const cookie = request.headers.get('cookie') ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl}/api/analysis/trade-journal`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
  } catch {
    return Response.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return Response.json(err, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
