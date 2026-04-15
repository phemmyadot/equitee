import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { market: string; ticker: string } },
) {
  const backendUrl = process.env.API_URL || 'http://localhost:8000';
  const { market, ticker } = params;
  const cookie = request.headers.get('cookie') ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(
      `${backendUrl}/api/signal-score/${encodeURIComponent(market)}/${encodeURIComponent(ticker)}`,
      { headers: { Cookie: cookie } },
    );
  } catch {
    return Response.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}
