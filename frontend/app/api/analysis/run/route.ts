import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Streaming proxy for POST /api/analysis/run.
 *
 * Next.js rewrites buffer SSE responses before forwarding them, so the
 * stream would only appear after completion. This Route Handler bypasses
 * the rewrite and pipes the FastAPI SSE stream directly to the browser
 * using the Web Streams API, preserving per-token delivery.
 */
export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_URL || 'http://localhost:8000';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ detail: 'Invalid request body' }, { status: 400 });
  }

  // Forward the auth cookie so the backend can identify the user
  const cookie = request.headers.get('cookie') ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl}/api/analysis/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return Response.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return Response.json(err, { status: upstream.status });
  }

  // Pipe the ReadableStream directly — no buffering
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
