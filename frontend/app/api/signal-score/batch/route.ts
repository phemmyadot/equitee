import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_URL || 'http://localhost:8000';
  const cookie = request.headers.get('cookie') ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl}/api/signal-score/batch`, {
      headers: { Cookie: cookie },
    });
  } catch {
    return Response.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}
