import { resolvePuzzleRequest } from '../lib/puzzleService.ts';

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: unknown): void;
  setHeader(name: string, value: string): void;
}

function getQueryParam(
  query: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  const val = query?.[key];
  if (Array.isArray(val)) return val[0];
  return val;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  const result = await resolvePuzzleRequest({
    mode: getQueryParam(req.query, 'mode'),
    era: getQueryParam(req.query, 'era'),
    date: getQueryParam(req.query, 'date'),
    exclude: getQueryParam(req.query, 'exclude'),
  });

  if (getQueryParam(req.query, 'mode') === 'daily' && result.status === 200) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  res.status(result.status).json(result.body);
}
